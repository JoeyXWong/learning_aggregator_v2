import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UpdateProgressParams {
  planId: string;
  resourceId: string;
  status: ProgressStatus;
  notes?: string;
  timeSpent?: number;
}

export interface ProgressEntryWithResource {
  id: string;
  planId: string;
  resourceId: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  timeSpent: number | null;
  createdAt: Date;
  updatedAt: Date;
  resource: {
    id: string;
    title: string;
    url: string;
    type: string;
    difficulty: string | null;
    duration: number | null;
  };
}

export interface ProgressStats {
  totalPlans: number;
  totalResources: number;
  completedResources: number;
  inProgressResources: number;
  notStartedResources: number;
  totalTimeSpent: number;
  averageCompletionRate: number;
  recentActivity: Array<{
    id: string;
    planId: string;
    resourceTitle: string;
    status: string;
    updatedAt: Date;
  }>;
}

/**
 * Progress Service
 * Manages progress tracking for learning plans and resources
 */
export class ProgressService {
  /**
   * Create or update a progress entry
   * Automatically manages timestamps based on status transitions
   */
  async updateProgress(params: UpdateProgressParams): Promise<ProgressEntryWithResource> {
    const { planId, resourceId, status, notes, timeSpent } = params;

    logger.info('Updating progress entry', { planId, resourceId, status });

    try {
      // Verify that plan and resource exist
      const plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Learning plan not found');
      }

      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        throw new Error('Resource not found');
      }

      // Get existing progress entry if it exists
      const existing = await prisma.progressEntry.findUnique({
        where: {
          planId_resourceId: {
            planId,
            resourceId,
          },
        },
      });

      // Determine timestamp updates based on status transitions
      const now = new Date();
      let startedAt = existing?.startedAt;
      let completedAt = existing?.completedAt;

      // If transitioning from not_started to in_progress or completed, set startedAt
      if (!existing || existing.status === 'not_started') {
        if (status === 'in_progress' || status === 'completed') {
          startedAt = startedAt || now;
        }
      }

      // If transitioning to completed, set completedAt
      if (status === 'completed') {
        completedAt = completedAt || now;
        startedAt = startedAt || now; // Ensure startedAt is set if completing directly
      } else if (existing?.status === 'completed') {
        // If moving from completed to another status, clear completedAt
        completedAt = null;
      }

      // Upsert the progress entry
      const progressEntry = await prisma.progressEntry.upsert({
        where: {
          planId_resourceId: {
            planId,
            resourceId,
          },
        },
        create: {
          planId,
          resourceId,
          status,
          notes: notes || null,
          timeSpent: timeSpent || null,
          startedAt,
          completedAt,
        },
        update: {
          status,
          notes: notes !== undefined ? notes : undefined,
          timeSpent: timeSpent !== undefined ? timeSpent : undefined,
          startedAt,
          completedAt,
        },
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              url: true,
              type: true,
              difficulty: true,
              duration: true,
            },
          },
        },
      });

      // Update plan completion percentage
      await this.updatePlanCompletion(planId);

      logger.info('Progress entry updated successfully', {
        entryId: progressEntry.id,
        planId,
        resourceId,
        status,
      });

      return progressEntry;
    } catch (error) {
      logger.error('Failed to update progress entry', { planId, resourceId, error });
      throw error;
    }
  }

  /**
   * Get all progress entries for a plan
   */
  async getProgressByPlan(planId: string): Promise<ProgressEntryWithResource[]> {
    logger.info('Fetching progress for plan', { planId });

    try {
      const plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Learning plan not found');
      }

      const progressEntries = await prisma.progressEntry.findMany({
        where: { planId },
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              url: true,
              type: true,
              difficulty: true,
              duration: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      logger.info('Progress entries fetched', {
        planId,
        count: progressEntries.length,
      });

      return progressEntries;
    } catch (error) {
      logger.error('Failed to fetch progress entries', { planId, error });
      throw error;
    }
  }

  /**
   * Get overall learning statistics
   */
  async getProgressStats(): Promise<ProgressStats> {
    logger.info('Fetching progress statistics');

    try {
      // Get all plans
      const plans = await prisma.learningPlan.findMany({
        include: {
          progressEntries: true,
        },
      });

      // Get all progress entries with resources for recent activity
      const allProgressEntries = await prisma.progressEntry.findMany({
        include: {
          resource: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      });

      // Calculate statistics
      const totalPlans = plans.length;
      let totalResources = 0;
      let completedResources = 0;
      let inProgressResources = 0;
      let notStartedResources = 0;
      let totalTimeSpent = 0;
      let totalCompletionPercentage = 0;

      plans.forEach((plan) => {
        totalResources += plan.progressEntries.length;
        totalCompletionPercentage += plan.completionPercentage;

        plan.progressEntries.forEach((entry) => {
          if (entry.status === 'completed') {
            completedResources++;
          } else if (entry.status === 'in_progress') {
            inProgressResources++;
          } else if (entry.status === 'not_started') {
            notStartedResources++;
          }

          if (entry.timeSpent) {
            totalTimeSpent += entry.timeSpent;
          }
        });
      });

      const averageCompletionRate = totalPlans > 0 ? totalCompletionPercentage / totalPlans : 0;

      const recentActivity = allProgressEntries.map((entry) => ({
        id: entry.id,
        planId: entry.planId,
        resourceTitle: entry.resource.title,
        status: entry.status,
        updatedAt: entry.updatedAt,
      }));

      const stats: ProgressStats = {
        totalPlans,
        totalResources,
        completedResources,
        inProgressResources,
        notStartedResources,
        totalTimeSpent,
        averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
        recentActivity,
      };

      logger.info('Progress statistics calculated', {
        totalPlans,
        totalResources,
        completedResources,
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch progress statistics', { error });
      throw error;
    }
  }

  /**
   * Update plan completion percentage based on progress entries
   */
  private async updatePlanCompletion(planId: string): Promise<void> {
    try {
      const plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
        include: {
          progressEntries: true,
        },
      });

      if (!plan) {
        return;
      }

      // Get total resources in the plan from the phases JSON
      let totalResourcesInPlan = 0;
      try {
        const phases = JSON.parse(plan.phases) as Array<{
          resources: Array<{ resourceId: string }>;
        }>;
        totalResourcesInPlan = phases.reduce(
          (sum, phase) => sum + phase.resources.length,
          0
        );
      } catch {
        logger.error('Failed to parse plan phases', { planId });
        // Fall back to counting progress entries
        totalResourcesInPlan = plan.progressEntries.length;
      }

      // Count completed resources
      const completedCount = plan.progressEntries.filter(
        (entry) => entry.status === 'completed'
      ).length;

      // Calculate completion percentage
      const completionPercentage =
        totalResourcesInPlan > 0 ? (completedCount / totalResourcesInPlan) * 100 : 0;

      // Update plan if percentage changed significantly
      if (Math.abs(completionPercentage - plan.completionPercentage) > 0.01) {
        await prisma.learningPlan.update({
          where: { id: planId },
          data: { completionPercentage },
        });

        logger.info('Plan completion percentage updated', {
          planId,
          completionPercentage,
        });
      }
    } catch (error) {
      logger.error('Failed to update plan completion', { planId, error });
      // Don't throw - this is a background update
    }
  }
}

export const progressService = new ProgressService();
