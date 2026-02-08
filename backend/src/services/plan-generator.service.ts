import Anthropic from '@anthropic-ai/sdk';
import { Resource } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

export interface PlanPreferences {
  freeOnly?: boolean;
  pace?: 'casual' | 'moderate' | 'intensive';
  preferredTypes?: string[];
  maxDuration?: number;
}

export interface PlanPhase {
  name: string;
  description: string;
  order: number;
  estimatedHours: number;
  resources: Array<{
    resourceId: string;
    title: string;
    url: string;
    type: string;
    difficulty: string;
    duration: number | null;
    reason: string;
  }>;
}

export interface GeneratedPlan {
  id: string;
  topicId: string;
  title: string;
  preferences: PlanPreferences;
  phases: PlanPhase[];
  totalDuration: number;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plan Generator Service
 * Uses Claude API to generate structured learning plans from aggregated resources
 */
export class PlanGeneratorService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.apiKeys.claude) {
      this.anthropic = new Anthropic({
        apiKey: config.apiKeys.claude,
      });
      logger.info('Claude API client initialized');
    } else {
      logger.warn('Claude API key not configured - will use fallback plan generation');
    }
  }

  /**
   * Generate a learning plan for a topic
   */
  async generatePlan(
    topicId: string,
    preferences: PlanPreferences = {}
  ): Promise<GeneratedPlan> {
    logger.info('Generating learning plan', { topicId, preferences });

    try {
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          resources: {
            include: {
              resource: true,
            },
            orderBy: {
              relevanceScore: 'desc',
            },
          },
        },
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      if (topic.resources.length === 0) {
        throw new Error('No resources available for this topic');
      }

      let resources = topic.resources.map((tr) => tr.resource);

      resources = this.applyPreferenceFilters(resources, preferences);

      if (resources.length === 0) {
        throw new Error('No resources match the specified preferences');
      }

      const phases = this.anthropic
        ? await this.generatePlanWithClaude(topic.name, resources, preferences)
        : this.generateFallbackPlan(resources);

      const totalDuration = phases.reduce(
        (sum, phase) => sum + phase.estimatedHours,
        0
      );

      const plan = await prisma.learningPlan.create({
        data: {
          topicId,
          title: `${topic.name} Learning Path`,
          preferences: JSON.stringify(preferences),
          phases: JSON.stringify(phases),
          totalDuration,
          completionPercentage: 0,
        },
      });

      logger.info('Learning plan generated successfully', {
        planId: plan.id,
        topicId,
        phaseCount: phases.length,
        totalDuration,
      });

      return {
        id: plan.id,
        topicId: plan.topicId,
        title: plan.title,
        preferences,
        phases,
        totalDuration,
        completionPercentage: plan.completionPercentage,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to generate learning plan', { topicId, error });
      throw error;
    }
  }

  /**
   * Generate plan using Claude API
   */
  private async generatePlanWithClaude(
    topicName: string,
    resources: Resource[],
    preferences: PlanPreferences
  ): Promise<PlanPhase[]> {
    if (!this.anthropic) {
      throw new Error('Claude API not initialized');
    }

    const prompt = this.buildPrompt(topicName, resources, preferences);

    logger.info('Requesting plan from Claude API', {
      topicName,
      resourceCount: resources.length,
    });

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      // Strip markdown code fences if present
      let jsonText = content.text.trim();
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonText = fenceMatch[1].trim();
      }

      let planData: unknown;
      try {
        planData = JSON.parse(jsonText);
      } catch {
        logger.error('Claude returned invalid JSON, using fallback plan', {
          rawPreview: content.text.slice(0, 500),
        });
        return this.generateFallbackPlan(resources);
      }

      // Validate structure
      if (
        !planData ||
        typeof planData !== 'object' ||
        !('phases' in planData) ||
        !Array.isArray((planData as { phases: unknown }).phases)
      ) {
        logger.error('Claude response missing phases array, using fallback plan');
        return this.generateFallbackPlan(resources);
      }

      const rawPhases = (planData as { phases: Array<Record<string, unknown>> }).phases;

      const phases: PlanPhase[] = rawPhases.map((phase, index: number) => ({
        name: String(phase.name || `Phase ${index + 1}`),
        description: String(phase.description || ''),
        order: index + 1,
        estimatedHours: Number(phase.estimatedHours) || 10,
        resources: (Array.isArray(phase.resources) ? phase.resources : []).map(
          (r: Record<string, unknown>) => {
            const resource = resources.find((res) => res.id === r.resourceId);
            return {
              resourceId: String(r.resourceId || ''),
              title: resource?.title || String(r.title || ''),
              url: resource?.url || String(r.url || ''),
              type: resource?.type || String(r.type || ''),
              difficulty: resource?.difficulty || String(r.difficulty || 'unknown'),
              duration: resource?.duration || null,
              reason: String(r.reason || 'Relevant to this learning phase'),
            };
          }
        ),
      }));

      logger.info('Successfully parsed Claude API response', {
        phaseCount: phases.length,
      });

      return phases;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Claude API request failed, falling back to simple plan', {
        error: message,
      });
      return this.generateFallbackPlan(resources);
    }
  }

  /**
   * Build prompt for Claude API
   */
  private buildPrompt(
    topicName: string,
    resources: Resource[],
    preferences: PlanPreferences
  ): string {
    const resourcesList = resources
      .map(
        (r, idx) =>
          `${idx + 1}. [${r.type}] ${r.title}
   - ID: ${r.id}
   - URL: ${r.url}
   - Difficulty: ${r.difficulty || 'unknown'}
   - Duration: ${r.duration ? `${r.duration} min` : 'N/A'}
   - Quality Score: ${r.qualityScore ?? 'N/A'}/100
   - Description: ${r.description || 'No description'}`
      )
      .join('\n\n');

    const preferencesText = `
User Preferences:
- Free resources only: ${preferences.freeOnly ? 'Yes' : 'No'}
- Learning pace: ${preferences.pace || 'moderate'}
- Preferred resource types: ${preferences.preferredTypes?.join(', ') || 'Any'}
- Maximum total duration: ${preferences.maxDuration ? `${preferences.maxDuration} hours` : 'No limit'}
`.trim();

    return `You are an expert learning path designer. Create a structured learning plan for the topic "${topicName}" using the provided resources.

${preferencesText}

Available Resources:
${resourcesList}

Instructions:
1. Organize the resources into logical learning phases (3-5 phases recommended)
2. Order resources within each phase from beginner to advanced
3. Each phase should build upon previous phases
4. Assign resources to phases based on their difficulty, type, and relevance
5. Estimate realistic time commitment for each phase
6. Provide a clear reason why each resource is included in its phase
7. Consider the user's preferences when selecting and ordering resources

Return your response as a JSON object with the following structure:
{
  "phases": [
    {
      "name": "Phase name (e.g., 'Foundation & Basics')",
      "description": "Clear description of what the learner will achieve in this phase",
      "estimatedHours": 15,
      "resources": [
        {
          "resourceId": "resource ID from the list above",
          "reason": "Why this resource is important for this phase"
        }
      ]
    }
  ]
}

Important:
- Only use resource IDs from the provided list
- Ensure each phase has at least 1-2 resources
- Make the plan practical and achievable
- Return ONLY valid JSON, no additional text`;
  }

  /**
   * Generate a simple fallback plan when Claude API is not available
   */
  private generateFallbackPlan(resources: Resource[]): PlanPhase[] {
    logger.info('Generating fallback plan', { resourceCount: resources.length });

    const beginner = resources.filter((r) => r.difficulty === 'beginner');
    const intermediate = resources.filter((r) => r.difficulty === 'intermediate');
    const advanced = resources.filter((r) => r.difficulty === 'advanced');
    const unknown = resources.filter(
      (r) => !r.difficulty || !['beginner', 'intermediate', 'advanced'].includes(r.difficulty)
    );

    const phases: PlanPhase[] = [];

    if (beginner.length > 0 || unknown.length > 0) {
      const phaseResources = beginner.concat(unknown.slice(0, 2));
      phases.push({
        name: 'Foundation & Basics',
        description: 'Start with fundamental concepts and beginner-friendly resources',
        order: 1,
        estimatedHours: this.estimatePhaseHours(phaseResources),
        resources: phaseResources.map((r) => ({
          resourceId: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty || 'beginner',
          duration: r.duration,
          reason: 'Essential foundation for learning this topic',
        })),
      });
    }

    if (intermediate.length > 0) {
      phases.push({
        name: 'Building Skills',
        description: 'Develop intermediate skills and practical knowledge',
        order: phases.length + 1,
        estimatedHours: this.estimatePhaseHours(intermediate),
        resources: intermediate.map((r) => ({
          resourceId: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty || 'intermediate',
          duration: r.duration,
          reason: 'Builds on foundation and develops practical skills',
        })),
      });
    }

    if (advanced.length > 0) {
      phases.push({
        name: 'Advanced Topics',
        description: 'Master advanced concepts and best practices',
        order: phases.length + 1,
        estimatedHours: this.estimatePhaseHours(advanced),
        resources: advanced.map((r) => ({
          resourceId: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty || 'advanced',
          duration: r.duration,
          reason: 'Advanced knowledge for mastery of the topic',
        })),
      });
    }

    if (phases.length === 0) {
      phases.push({
        name: 'Complete Learning Path',
        description: 'Comprehensive resources for learning this topic',
        order: 1,
        estimatedHours: this.estimatePhaseHours(resources),
        resources: resources.map((r) => ({
          resourceId: r.id,
          title: r.title,
          url: r.url,
          type: r.type,
          difficulty: r.difficulty || 'unknown',
          duration: r.duration,
          reason: 'Recommended resource for this topic',
        })),
      });
    }

    return phases;
  }

  /**
   * Estimate phase duration based on resources
   */
  private estimatePhaseHours(resources: Resource[]): number {
    const totalMinutes = resources.reduce((sum, r) => {
      if (r.duration) {
        return sum + r.duration;
      }
      const typeEstimates: Record<string, number> = {
        video: 30,
        course: 180,
        article: 20,
        documentation: 60,
        tutorial: 45,
        repository: 120,
      };
      return sum + (typeEstimates[r.type] || 60);
    }, 0);

    const hours = Math.ceil(totalMinutes / 60);
    return Math.ceil(hours * 1.25);
  }

  /**
   * Apply user preferences to filter resources
   */
  private applyPreferenceFilters(resources: Resource[], preferences: PlanPreferences): Resource[] {
    let filtered = [...resources];

    if (preferences.freeOnly) {
      filtered = filtered.filter((r) => r.pricing === 'free');
    }

    if (preferences.preferredTypes && preferences.preferredTypes.length > 0) {
      filtered = filtered.filter((r) =>
        preferences.preferredTypes!.includes(r.type)
      );
    }

    return filtered;
  }

  /**
   * Get a learning plan by ID
   */
  async getPlan(planId: string): Promise<GeneratedPlan | null> {
    try {
      const plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
        include: {
          topic: true,
          progressEntries: {
            include: {
              resource: true,
            },
          },
        },
      });

      if (!plan) {
        return null;
      }

      let preferences: PlanPreferences;
      let phases: PlanPhase[];
      try {
        preferences = JSON.parse(plan.preferences) as PlanPreferences;
        phases = JSON.parse(plan.phases) as PlanPhase[];
      } catch {
        logger.error('Failed to parse plan JSON fields', { planId });
        preferences = {};
        phases = [];
      }

      const totalResources = phases.reduce(
        (sum, phase) => sum + phase.resources.length,
        0
      );
      const completedResources = plan.progressEntries.filter(
        (entry) => entry.status === 'completed'
      ).length;
      const completionPercentage =
        totalResources > 0 ? (completedResources / totalResources) * 100 : 0;

      if (Math.abs(completionPercentage - plan.completionPercentage) > 0.01) {
        await prisma.learningPlan.update({
          where: { id: planId },
          data: { completionPercentage },
        });
      }

      return {
        id: plan.id,
        topicId: plan.topicId,
        title: plan.title,
        preferences,
        phases,
        totalDuration: plan.totalDuration || 0,
        completionPercentage,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to get learning plan', { planId, error });
      throw error;
    }
  }

  /**
   * List all learning plans
   */
  async listPlans(): Promise<GeneratedPlan[]> {
    try {
      const plans = await prisma.learningPlan.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          topic: true,
        },
        take: 50,
      });

      return plans.map((plan) => {
        let preferences: PlanPreferences;
        let phases: PlanPhase[];
        try {
          preferences = JSON.parse(plan.preferences) as PlanPreferences;
          phases = JSON.parse(plan.phases) as PlanPhase[];
        } catch {
          preferences = {};
          phases = [];
        }

        return {
          id: plan.id,
          topicId: plan.topicId,
          title: plan.title,
          preferences,
          phases,
          totalDuration: plan.totalDuration || 0,
          completionPercentage: plan.completionPercentage,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      });
    } catch (error) {
      logger.error('Failed to list learning plans', { error });
      throw error;
    }
  }

  /**
   * Delete a learning plan
   */
  async deletePlan(planId: string): Promise<void> {
    try {
      await prisma.learningPlan.delete({
        where: { id: planId },
      });

      logger.info('Learning plan deleted', { planId });
    } catch (error) {
      logger.error('Failed to delete learning plan', { planId, error });
      throw error;
    }
  }

  /**
   * Export plan as markdown
   */
  exportAsMarkdown(plan: GeneratedPlan): string {
    let markdown = `# ${plan.title}\n\n`;
    markdown += `**Total Duration:** ${plan.totalDuration} hours\n`;
    markdown += `**Completion:** ${plan.completionPercentage.toFixed(1)}%\n`;
    markdown += `**Created:** ${plan.createdAt.toLocaleDateString()}\n\n`;

    if (plan.preferences) {
      markdown += `## Preferences\n\n`;
      if (plan.preferences.freeOnly) {
        markdown += `- Free resources only\n`;
      }
      if (plan.preferences.pace) {
        markdown += `- Learning pace: ${plan.preferences.pace}\n`;
      }
      if (plan.preferences.preferredTypes && plan.preferences.preferredTypes.length > 0) {
        markdown += `- Preferred types: ${plan.preferences.preferredTypes.join(', ')}\n`;
      }
      markdown += `\n`;
    }

    markdown += `## Learning Path\n\n`;

    plan.phases.forEach((phase) => {
      markdown += `### Phase ${phase.order}: ${phase.name}\n\n`;
      markdown += `${phase.description}\n\n`;
      markdown += `**Estimated time:** ${phase.estimatedHours} hours\n\n`;
      markdown += `#### Resources\n\n`;

      phase.resources.forEach((resource, idx) => {
        markdown += `${idx + 1}. **[${resource.title}](${resource.url})**\n`;
        markdown += `   - Type: ${resource.type}\n`;
        markdown += `   - Difficulty: ${resource.difficulty}\n`;
        if (resource.duration) {
          markdown += `   - Duration: ${resource.duration} min\n`;
        }
        markdown += `   - Why: ${resource.reason}\n\n`;
      });

      markdown += `\n`;
    });

    markdown += `---\n\n`;
    markdown += `*Generated by Learning Aggregator V2*\n`;

    return markdown;
  }

  /**
   * Export plan as PDF
   */
  async exportAsPdf(plan: GeneratedPlan): Promise<Buffer> {
    // Use the markdown content to generate a simple PDF
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text(plan.title, { align: 'center' });
      doc.moveDown();

      // Metadata
      doc.fontSize(11).font('Helvetica')
        .text(`Total Duration: ${plan.totalDuration} hours`)
        .text(`Completion: ${plan.completionPercentage.toFixed(1)}%`)
        .text(`Created: ${plan.createdAt.toLocaleDateString()}`);
      doc.moveDown();

      // Preferences
      if (plan.preferences && (plan.preferences.freeOnly || plan.preferences.pace || plan.preferences.preferredTypes?.length)) {
        doc.fontSize(16).font('Helvetica-Bold').text('Preferences');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        if (plan.preferences.freeOnly) {
          doc.text('  - Free resources only');
        }
        if (plan.preferences.pace) {
          doc.text(`  - Learning pace: ${plan.preferences.pace}`);
        }
        if (plan.preferences.preferredTypes && plan.preferences.preferredTypes.length > 0) {
          doc.text(`  - Preferred types: ${plan.preferences.preferredTypes.join(', ')}`);
        }
        doc.moveDown();
      }

      // Phases
      doc.fontSize(18).font('Helvetica-Bold').text('Learning Path');
      doc.moveDown();

      plan.phases.forEach((phase) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(14).font('Helvetica-Bold')
          .text(`Phase ${phase.order}: ${phase.name}`);
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica')
          .text(phase.description);
        doc.fontSize(10).font('Helvetica-Oblique')
          .text(`Estimated time: ${phase.estimatedHours} hours`);
        doc.moveDown(0.5);

        phase.resources.forEach((resource, idx) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          doc.fontSize(11).font('Helvetica-Bold')
            .text(`${idx + 1}. ${resource.title}`);
          doc.fontSize(9).font('Helvetica')
            .text(`   Type: ${resource.type} | Difficulty: ${resource.difficulty}${resource.duration ? ` | Duration: ${resource.duration} min` : ''}`)
            .text(`   ${resource.url}`, { link: resource.url, underline: true })
            .text(`   Why: ${resource.reason}`);
          doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
      });

      // Footer
      doc.moveDown();
      doc.fontSize(9).font('Helvetica-Oblique')
        .text('Generated by Learning Aggregator V2', { align: 'center' });

      doc.end();
    });
  }
}

export const planGeneratorService = new PlanGeneratorService();
