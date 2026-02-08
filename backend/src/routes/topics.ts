import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aggregatorService } from '../services/aggregator.service';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createTopicSchema = z.object({
  name: z
    .string()
    .min(2, 'Topic name must be at least 2 characters')
    .max(200, 'Topic name must not exceed 200 characters')
    .trim(),
  options: z
    .object({
      maxResourcesPerSource: z.number().min(5).max(50).optional(),
      includeYouTube: z.boolean().optional(),
      includeGitHub: z.boolean().optional(),
      minQualityScore: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

const getResourcesSchema = z.object({
  type: z.string().optional(),
  difficulty: z.string().optional(),
  pricing: z.string().optional(),
  minQualityScore: z.coerce.number().min(0).max(100).optional(),
});

/**
 * POST /api/topics
 * Submit a topic for resource aggregation
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = createTopicSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Invalid request data');
    }

    const { name, options } = validation.data;

    logger.info('Topic aggregation requested', { name, options });

    const result = await aggregatorService.aggregateResources(name, options);

    res.status(201).json({
      success: true,
      message: 'Resources aggregated successfully',
      data: result,
    });
  })
);

/**
 * GET /api/topics/:id/resources
 * Get all resources for a topic with optional filters
 */
router.get(
  '/:id/resources',
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = req.params.id as string;

    const validation = getResourcesSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'Invalid query parameters');
    }

    const filters = validation.data;

    logger.info('Fetching topic resources', { topicId, filters });

    const resources = await aggregatorService.getTopicResources(topicId, filters);

    // Group resources by type for frontend
    const groupedByType: Record<string, typeof resources> = {};
    for (const resource of resources) {
      const type = resource.type || 'other';
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push(resource);
    }

    res.json({
      success: true,
      data: {
        topicId,
        totalCount: resources.length,
        filters,
        resources,
        groupedByType,
        metadata: {
          types: Object.keys(groupedByType).map((type) => ({
            type,
            count: groupedByType[type].length,
          })),
          difficulties: countByField(resources, 'difficulty'),
          pricing: countByField(resources, 'pricing'),
        },
      },
    });
  })
);

/**
 * GET /api/topics/:id
 * Get topic details
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = req.params.id as string;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    if (!topic) {
      throw new AppError(404, 'Topic not found');
    }

    res.json({
      success: true,
      data: topic,
    });
  })
);

/**
 * GET /api/topics
 * List all topics
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const topics = await prisma.topic.findMany({
      orderBy: {
        lastAggregatedAt: 'desc',
      },
      take: 50,
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        topics,
        count: topics.length,
      },
    });
  })
);

/**
 * DELETE /api/topics/:id/cache
 * Clear cache for a topic (force re-aggregation)
 */
router.delete(
  '/:id/cache',
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = req.params.id as string;

    aggregatorService.clearCache(topicId);

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  })
);

// Helper function to count resources by field
function countByField(
  resources: Array<Record<string, unknown>>,
  field: string
): Array<{ value: string; count: number }> {
  const counts: Record<string, number> = {};

  resources.forEach((resource) => {
    const value = String(resource[field] || 'unknown');
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts).map(([value, count]) => ({
    value,
    count,
  }));
}

export default router;
