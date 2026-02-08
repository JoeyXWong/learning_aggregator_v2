import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  })
);

router.get('/health/db', asyncHandler(async (_req: Request, res: Response) => {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const duration = Date.now() - start;

  res.json({
    success: true,
    database: 'connected',
    responseTime: `${duration}ms`,
  });
}));

export default router;
