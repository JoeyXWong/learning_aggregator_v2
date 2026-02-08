import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { progressService } from '../services/progress.service';
import { logger } from '../utils/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createProgressSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  status: z.enum(['not_started', 'in_progress', 'completed'], {
    errorMap: () => ({ message: 'Status must be one of: not_started, in_progress, completed' }),
  }),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional(),
  timeSpent: z
    .number()
    .int('Time spent must be an integer')
    .min(0, 'Time spent must be non-negative')
    .optional(),
});

const updateProgressSchema = z.object({
  status: z
    .enum(['not_started', 'in_progress', 'completed'], {
      errorMap: () => ({ message: 'Status must be one of: not_started, in_progress, completed' }),
    })
    .optional(),
  notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional(),
  timeSpent: z
    .number()
    .int('Time spent must be an integer')
    .min(0, 'Time spent must be non-negative')
    .optional(),
});

/**
 * POST /api/progress
 * Create or update a progress entry
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = createProgressSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Invalid request data');
    }

    const { planId, resourceId, status, notes, timeSpent } = validation.data;

    logger.info('Progress update requested', { planId, resourceId, status });

    const progressEntry = await progressService.updateProgress({
      planId,
      resourceId,
      status,
      notes,
      timeSpent,
    });

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: progressEntry,
    });
  })
);

/**
 * GET /api/progress/stats
 * Get overall learning statistics
 * Note: This route must be defined before /:planId to avoid routing conflicts
 */
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    logger.info('Progress statistics requested');

    const stats = await progressService.getProgressStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/progress/:planId
 * Get all progress entries for a plan
 */
router.get(
  '/:planId',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.params.planId as string;

    logger.info('Fetching progress for plan', { planId });

    const progressEntries = await progressService.getProgressByPlan(planId);

    // Calculate summary statistics for this plan
    const totalResources = progressEntries.length;
    const completedCount = progressEntries.filter(
      (entry) => entry.status === 'completed'
    ).length;
    const inProgressCount = progressEntries.filter(
      (entry) => entry.status === 'in_progress'
    ).length;
    const notStartedCount = progressEntries.filter(
      (entry) => entry.status === 'not_started'
    ).length;
    const totalTimeSpent = progressEntries.reduce(
      (sum, entry) => sum + (entry.timeSpent || 0),
      0
    );

    res.json({
      success: true,
      data: {
        planId,
        progressEntries,
        summary: {
          totalResources,
          completedCount,
          inProgressCount,
          notStartedCount,
          totalTimeSpent,
          completionPercentage:
            totalResources > 0 ? (completedCount / totalResources) * 100 : 0,
        },
      },
    });
  })
);

/**
 * PATCH /api/progress/:planId/:resourceId
 * Update a specific progress entry
 */
router.patch(
  '/:planId/:resourceId',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.params.planId as string;
    const resourceId = req.params.resourceId as string;

    const validation = updateProgressSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Invalid request data');
    }

    const updates = validation.data;

    // At least one field must be provided
    if (!updates.status && updates.notes === undefined && updates.timeSpent === undefined) {
      throw new AppError(400, 'At least one field must be provided for update');
    }

    logger.info('Updating specific progress entry', { planId, resourceId, updates });

    // Get existing entry to merge with updates
    const existingEntries = await progressService.getProgressByPlan(planId);
    const existing = existingEntries.find((entry) => entry.resourceId === resourceId);

    if (!existing) {
      throw new AppError(404, 'Progress entry not found');
    }

    // Merge updates with existing data
    const progressEntry = await progressService.updateProgress({
      planId,
      resourceId,
      status: updates.status || (existing.status as 'not_started' | 'in_progress' | 'completed'),
      notes: updates.notes !== undefined ? updates.notes : (existing.notes || undefined),
      timeSpent: updates.timeSpent !== undefined ? updates.timeSpent : (existing.timeSpent || undefined),
    });

    res.json({
      success: true,
      message: 'Progress entry updated successfully',
      data: progressEntry,
    });
  })
);

export default router;
