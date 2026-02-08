import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { planGeneratorService } from '../services/plan-generator.service';
import { logger } from '../utils/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const generatePlanSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  preferences: z
    .object({
      freeOnly: z.boolean().optional(),
      pace: z.enum(['casual', 'moderate', 'intensive']).optional(),
      preferredTypes: z.array(z.string()).optional(),
      maxDuration: z.number().min(1).optional(),
    })
    .optional(),
});

const exportFormatSchema = z.object({
  format: z.enum(['markdown', 'pdf']).optional().default('markdown'),
});

/**
 * POST /api/plans/generate
 * Generate a learning plan for a topic
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = generatePlanSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Invalid request data');
    }

    const { topicId, preferences } = validation.data;

    logger.info('Plan generation requested', { topicId, preferences });

    const plan = await planGeneratorService.generatePlan(topicId, preferences);

    res.status(201).json({
      success: true,
      message: 'Learning plan generated successfully',
      data: plan,
    });
  })
);

/**
 * GET /api/plans/:id
 * Get a learning plan by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.params.id as string;

    logger.info('Fetching learning plan', { planId });

    const plan = await planGeneratorService.getPlan(planId);

    if (!plan) {
      throw new AppError(404, 'Learning plan not found');
    }

    res.json({
      success: true,
      data: plan,
    });
  })
);

/**
 * GET /api/plans
 * List all learning plans
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    logger.info('Fetching all learning plans');

    const plans = await planGeneratorService.listPlans();

    res.json({
      success: true,
      data: {
        plans,
        count: plans.length,
      },
    });
  })
);

/**
 * DELETE /api/plans/:id
 * Delete a learning plan
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.params.id as string;

    logger.info('Deleting learning plan', { planId });

    await planGeneratorService.deletePlan(planId);

    res.json({
      success: true,
      message: 'Learning plan deleted successfully',
    });
  })
);

/**
 * GET /api/plans/:id/export
 * Export a learning plan
 */
router.get(
  '/:id/export',
  asyncHandler(async (req: Request, res: Response) => {
    const planId = req.params.id as string;

    const validation = exportFormatSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'Invalid query parameters');
    }

    const { format } = validation.data;

    logger.info('Exporting learning plan', { planId, format });

    const plan = await planGeneratorService.getPlan(planId);

    if (!plan) {
      throw new AppError(404, 'Learning plan not found');
    }

    if (format === 'markdown') {
      const markdown = planGeneratorService.exportAsMarkdown(plan);

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="learning-plan-${planId}.md"`
      );
      res.send(markdown);
    } else if (format === 'pdf') {
      const pdfBuffer = await planGeneratorService.exportAsPdf(plan);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="learning-plan-${planId}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      throw new AppError(400, 'Unsupported export format');
    }
  })
);

export default router;
