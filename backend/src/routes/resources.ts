import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { prisma } from '../utils/db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const searchResourcesSchema = z.object({
  query: z.string().min(2).optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  pricing: z.string().optional(),
  minQualityScore: z.coerce.number().min(0).max(100).optional(),
  platform: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * GET /api/resources/search
 * Search across all resources with filters
 */
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = searchResourcesSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'Invalid query parameters');
    }

    const {
      query,
      type,
      difficulty,
      pricing,
      minQualityScore,
      platform,
      limit,
      offset,
    } = validation.data;

    logger.info('Searching resources', { query, filters: validation.data });

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (pricing) {
      where.pricing = pricing;
    }

    if (platform) {
      where.platform = { contains: platform };
    }

    if (minQualityScore !== undefined) {
      where.qualityScore = { gte: minQualityScore };
    }

    // Fetch resources with pagination
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: [
          { qualityScore: 'desc' },
          { rating: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.resource.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  })
);

/**
 * GET /api/resources/:id
 * Get detailed information about a specific resource
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const resourceId = req.params.id as string;

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        topics: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!resource) {
      throw new AppError(404, 'Resource not found');
    }

    res.json({
      success: true,
      data: resource,
    });
  })
);

/**
 * GET /api/resources/stats
 * Get overall statistics about resources
 */
router.get(
  '/stats/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalResources,
      byType,
      byDifficulty,
      byPricing,
      avgQualityScore,
    ] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.resource.groupBy({
        by: ['difficulty'],
        _count: true,
      }),
      prisma.resource.groupBy({
        by: ['pricing'],
        _count: true,
      }),
      prisma.resource.aggregate({
        _avg: {
          qualityScore: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalResources,
        byType: byType.map((item) => ({
          type: item.type,
          count: item._count,
        })),
        byDifficulty: byDifficulty.map((item) => ({
          difficulty: item.difficulty,
          count: item._count,
        })),
        byPricing: byPricing.map((item) => ({
          pricing: item.pricing,
          count: item._count,
        })),
        averageQualityScore: avgQualityScore._avg.qualityScore || 0,
      },
    });
  })
);

export default router;
