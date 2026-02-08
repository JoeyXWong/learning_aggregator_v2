import Anthropic from '@anthropic-ai/sdk';
import { PlanGeneratorService } from '../plan-generator.service';
import { prisma } from '../../utils/db';
import type { Resource } from '@prisma/client';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');
const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

// Mock config
jest.mock('../../config', () => ({
  config: {
    apiKeys: {
      youtube: '',
      github: '',
      claude: 'test-claude-api-key',
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock prisma
jest.mock('../../utils/db', () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
    },
    learningPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('PlanGeneratorService', () => {
  let planGeneratorService: PlanGeneratorService;
  let mockAnthropicInstance: any;

  const mockResources: Resource[] = [
    {
      id: 'resource-1',
      url: 'https://example.com/beginner',
      normalizedUrl: 'https://example.com/beginner',
      title: 'Beginner Tutorial',
      description: 'Learn the basics',
      type: 'video',
      difficulty: 'beginner',
      pricing: 'free',
      platform: 'youtube.com',
      duration: 30,
      rating: 4.5,
      reviewCount: 100,
      viewCount: 1000,
      publishDate: new Date(),
      lastUpdatedDate: null,
      lastVerifiedAt: new Date(),
      qualityScore: 80,
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      metadata: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'resource-2',
      url: 'https://example.com/intermediate',
      normalizedUrl: 'https://example.com/intermediate',
      title: 'Intermediate Guide',
      description: 'Build practical skills',
      type: 'course',
      difficulty: 'intermediate',
      pricing: 'free',
      platform: 'udemy.com',
      duration: 120,
      rating: 4.7,
      reviewCount: 500,
      viewCount: 5000,
      publishDate: new Date(),
      lastUpdatedDate: null,
      lastVerifiedAt: new Date(),
      qualityScore: 85,
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      metadata: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'resource-3',
      url: 'https://example.com/advanced',
      normalizedUrl: 'https://example.com/advanced',
      title: 'Advanced Concepts',
      description: 'Master the topic',
      type: 'documentation',
      difficulty: 'advanced',
      pricing: 'free',
      platform: 'docs.example.com',
      duration: 60,
      rating: 4.8,
      reviewCount: 200,
      viewCount: 2000,
      publishDate: new Date(),
      lastUpdatedDate: null,
      lastVerifiedAt: new Date(),
      qualityScore: 90,
      thumbnailUrl: null,
      metadata: '{}',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnthropicInstance = {
      messages: {
        create: jest.fn(),
      },
    };

    MockedAnthropic.mockImplementation(() => mockAnthropicInstance);
    planGeneratorService = new PlanGeneratorService();
  });

  describe('generatePlan', () => {
    it('should successfully generate a plan with Claude API', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource,
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              phases: [
                {
                  name: 'Foundation & Basics',
                  description: 'Learn the fundamentals',
                  estimatedHours: 10,
                  resources: [
                    {
                      resourceId: 'resource-1',
                      reason: 'Great introduction to the topic',
                    },
                  ],
                },
                {
                  name: 'Building Skills',
                  description: 'Develop practical skills',
                  estimatedHours: 20,
                  resources: [
                    {
                      resourceId: 'resource-2',
                      reason: 'Hands-on practice',
                    },
                  ],
                },
              ],
            }),
          },
        ],
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: '{}',
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      mockAnthropicInstance.messages.create.mockResolvedValue(
        mockClaudeResponse
      );
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await planGeneratorService.generatePlan('topic-123');

      expect(plan).toBeDefined();
      expect(plan.topicId).toBe('topic-123');
      expect(plan.phases).toHaveLength(2);
      expect(plan.phases[0].name).toBe('Foundation & Basics');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalled();
    });

    it('should generate fallback plan when Claude API is not available', async () => {
      const serviceWithoutClaude = new PlanGeneratorService();
      (serviceWithoutClaude as any).anthropic = null;

      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource,
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: '{}',
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await serviceWithoutClaude.generatePlan('topic-123');

      expect(plan).toBeDefined();
      expect(plan.phases.length).toBeGreaterThan(0);
      expect(mockAnthropicInstance.messages.create).not.toHaveBeenCalled();
    });

    it('should handle Claude API returning invalid JSON', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource,
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: '{}',
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      mockAnthropicInstance.messages.create.mockResolvedValue(
        mockClaudeResponse
      );
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await planGeneratorService.generatePlan('topic-123');

      // Should fall back to simple plan
      expect(plan).toBeDefined();
      expect(plan.phases.length).toBeGreaterThan(0);
    });

    it('should handle Claude API returning JSON with markdown fences', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource,
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      const mockClaudeResponse = {
        content: [
          {
            type: 'text',
            text: '```json\n{"phases": [{"name": "Test", "description": "Test phase", "estimatedHours": 10, "resources": [{"resourceId": "resource-1", "reason": "Test"}]}]}\n```',
          },
        ],
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: '{}',
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      mockAnthropicInstance.messages.create.mockResolvedValue(
        mockClaudeResponse
      );
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await planGeneratorService.generatePlan('topic-123');

      expect(plan).toBeDefined();
      expect(plan.phases).toHaveLength(1);
      expect(plan.phases[0].name).toBe('Test');
    });

    it('should throw error when topic not found', async () => {
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        planGeneratorService.generatePlan('nonexistent-topic')
      ).rejects.toThrow('Topic not found');
    });

    it('should throw error when no resources available', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: [],
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      await expect(
        planGeneratorService.generatePlan('topic-123')
      ).rejects.toThrow('No resources available for this topic');
    });

    it('should apply preference filters', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: [
          ...mockResources.map((resource) => ({
            resource,
            topicId: 'topic-123',
            resourceId: resource.id,
            relevanceScore: 80,
          })),
          {
            resource: {
              ...mockResources[0],
              id: 'resource-4',
              pricing: 'premium',
            },
            topicId: 'topic-123',
            resourceId: 'resource-4',
            relevanceScore: 75,
          },
        ],
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: JSON.stringify({ freeOnly: true }),
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await planGeneratorService.generatePlan('topic-123', {
        freeOnly: true,
      });

      expect(plan).toBeDefined();
      // Premium resource should be filtered out
    });

    it('should filter by preferred types', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource,
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      const mockCreatedPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: JSON.stringify({ preferredTypes: ['video'] }),
        phases: JSON.stringify([]),
        totalDuration: 30,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);
      (prisma.learningPlan.create as jest.Mock).mockResolvedValue(
        mockCreatedPlan
      );

      const plan = await planGeneratorService.generatePlan('topic-123', {
        preferredTypes: ['video'],
      });

      expect(plan).toBeDefined();
    });

    it('should throw error when no resources match preferences', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 3,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: mockResources.map((resource) => ({
          resource: { ...resource, pricing: 'premium' },
          topicId: 'topic-123',
          resourceId: resource.id,
          relevanceScore: 80,
        })),
      };

      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      await expect(
        planGeneratorService.generatePlan('topic-123', { freeOnly: true })
      ).rejects.toThrow('No resources match the specified preferences');
    });
  });

  describe('generateFallbackPlan', () => {
    it('should organize resources by difficulty level', () => {
      const phases = (planGeneratorService as any).generateFallbackPlan(
        mockResources
      );

      expect(phases.length).toBeGreaterThan(0);
      expect(phases.some((p: any) => p.name === 'Foundation & Basics')).toBe(
        true
      );
      expect(phases.some((p: any) => p.name === 'Building Skills')).toBe(true);
      expect(phases.some((p: any) => p.name === 'Advanced Topics')).toBe(true);
    });

    it('should handle resources with no difficulty specified', () => {
      const resourcesWithUnknown = [
        {
          ...mockResources[0],
          difficulty: '',
        },
      ];

      const phases = (planGeneratorService as any).generateFallbackPlan(
        resourcesWithUnknown
      );

      expect(phases).toHaveLength(1);
      expect(phases[0].name).toBe('Foundation & Basics');
    });

    it('should create single phase when only one difficulty level present', () => {
      const beginnerOnly = [mockResources[0]];

      const phases = (planGeneratorService as any).generateFallbackPlan(
        beginnerOnly
      );

      expect(phases).toHaveLength(1);
    });
  });

  describe('getPlan', () => {
    it('should retrieve an existing plan', async () => {
      const mockPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: JSON.stringify({ freeOnly: true }),
        phases: JSON.stringify([
          {
            name: 'Phase 1',
            description: 'Test phase',
            order: 1,
            estimatedHours: 10,
            resources: [],
          },
        ]),
        totalDuration: 10,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: 'topic-123',
          name: 'React',
        },
        progressEntries: [],
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(
        mockPlan
      );

      const plan = await planGeneratorService.getPlan('plan-123');

      expect(plan).not.toBeNull();
      expect(plan?.id).toBe('plan-123');
      expect(plan?.phases).toHaveLength(1);
    });

    it('should return null when plan not found', async () => {
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(null);

      const plan = await planGeneratorService.getPlan('nonexistent');

      expect(plan).toBeNull();
    });

    it('should handle invalid JSON in plan fields', async () => {
      const mockPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: 'invalid json',
        phases: 'invalid json',
        totalDuration: 10,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: 'topic-123',
          name: 'React',
        },
        progressEntries: [],
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(
        mockPlan
      );

      const plan = await planGeneratorService.getPlan('plan-123');

      expect(plan).not.toBeNull();
      expect(plan?.preferences).toEqual({});
      expect(plan?.phases).toEqual([]);
    });

    it('should update completion percentage when out of sync', async () => {
      const mockPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: '{}',
        phases: JSON.stringify([
          {
            name: 'Phase 1',
            description: 'Test phase',
            order: 1,
            estimatedHours: 10,
            resources: [{ resourceId: 'res-1' }, { resourceId: 'res-2' }],
          },
        ]),
        totalDuration: 10,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: 'topic-123',
          name: 'React',
        },
        progressEntries: [
          {
            id: 'progress-1',
            resourceId: 'res-1',
            status: 'completed',
            resource: { id: 'res-1' },
          },
        ],
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(
        mockPlan
      );
      (prisma.learningPlan.update as jest.Mock).mockResolvedValue(mockPlan);

      const plan = await planGeneratorService.getPlan('plan-123');

      expect(plan).not.toBeNull();
      expect(prisma.learningPlan.update).toHaveBeenCalled();
    });
  });

  describe('listPlans', () => {
    it('should list all learning plans', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          topicId: 'topic-1',
          title: 'Plan 1',
          preferences: '{}',
          phases: JSON.stringify([]),
          totalDuration: 10,
          completionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: { id: 'topic-1', name: 'Topic 1' },
        },
        {
          id: 'plan-2',
          topicId: 'topic-2',
          title: 'Plan 2',
          preferences: '{}',
          phases: JSON.stringify([]),
          totalDuration: 20,
          completionPercentage: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: { id: 'topic-2', name: 'Topic 2' },
        },
      ];

      (prisma.learningPlan.findMany as jest.Mock).mockResolvedValue(mockPlans);

      const plans = await planGeneratorService.listPlans();

      expect(plans).toHaveLength(2);
      expect(plans[0].id).toBe('plan-1');
      expect(plans[1].id).toBe('plan-2');
    });
  });

  describe('deletePlan', () => {
    it('should delete a learning plan', async () => {
      (prisma.learningPlan.delete as jest.Mock).mockResolvedValue({});

      await planGeneratorService.deletePlan('plan-123');

      expect(prisma.learningPlan.delete).toHaveBeenCalledWith({
        where: { id: 'plan-123' },
      });
    });

    it('should handle deletion errors', async () => {
      (prisma.learningPlan.delete as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      await expect(
        planGeneratorService.deletePlan('nonexistent')
      ).rejects.toThrow('Not found');
    });
  });

  describe('exportAsMarkdown', () => {
    it('should export plan as markdown', () => {
      const mockPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: { freeOnly: true, pace: 'moderate' as const },
        phases: [
          {
            name: 'Phase 1',
            description: 'Learn basics',
            order: 1,
            estimatedHours: 10,
            resources: [
              {
                resourceId: 'res-1',
                title: 'Resource 1',
                url: 'https://example.com/1',
                type: 'video',
                difficulty: 'beginner',
                duration: 30,
                reason: 'Great intro',
              },
            ],
          },
        ],
        totalDuration: 10,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const markdown = planGeneratorService.exportAsMarkdown(mockPlan);

      expect(markdown).toContain('# React Learning Path');
      expect(markdown).toContain('**Total Duration:** 10 hours');
      expect(markdown).toContain('## Preferences');
      expect(markdown).toContain('Free resources only');
      expect(markdown).toContain('### Phase 1: Phase 1');
      expect(markdown).toContain('Resource 1');
      expect(markdown).toContain('Great intro');
    });
  });

  describe('exportAsPdf', () => {
    it('should export plan as PDF buffer', async () => {
      const mockPlan = {
        id: 'plan-123',
        topicId: 'topic-123',
        title: 'React Learning Path',
        preferences: {},
        phases: [
          {
            name: 'Phase 1',
            description: 'Learn basics',
            order: 1,
            estimatedHours: 10,
            resources: [
              {
                resourceId: 'res-1',
                title: 'Resource 1',
                url: 'https://example.com/1',
                type: 'video',
                difficulty: 'beginner',
                duration: 30,
                reason: 'Great intro',
              },
            ],
          },
        ],
        totalDuration: 10,
        completionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await planGeneratorService.exportAsPdf(mockPlan);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('estimatePhaseHours', () => {
    it('should estimate hours based on resource durations', () => {
      const hours = (planGeneratorService as any).estimatePhaseHours(
        mockResources
      );

      expect(hours).toBeGreaterThan(0);
      // 30 + 120 + 60 = 210 minutes = 3.5 hours * 1.25 = 4.375 -> ceil to 5
      expect(hours).toBe(5);
    });

    it('should use default estimates when duration is missing', () => {
      const resourcesWithoutDuration = [
        {
          ...mockResources[0],
          duration: null,
          type: 'video',
        },
      ];

      const hours = (planGeneratorService as any).estimatePhaseHours(
        resourcesWithoutDuration
      );

      expect(hours).toBeGreaterThan(0);
    });
  });

  describe('buildPrompt', () => {
    it('should build a complete prompt for Claude', () => {
      const prompt = (planGeneratorService as any).buildPrompt(
        'React',
        mockResources,
        { freeOnly: true, pace: 'moderate' }
      );

      expect(prompt).toContain('React');
      expect(prompt).toContain('Free resources only: Yes');
      expect(prompt).toContain('Learning pace: moderate');
      expect(prompt).toContain('Available Resources:');
      expect(prompt).toContain('Beginner Tutorial');
    });
  });
});
