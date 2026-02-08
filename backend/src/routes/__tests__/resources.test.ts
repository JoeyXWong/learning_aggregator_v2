import request from 'supertest';
import express, { Application } from 'express';
import resourcesRoutes from '../resources';
import { prisma } from '../../utils/db';
import { errorHandler } from '../../middleware/errorHandler';

// Mock prisma
jest.mock('../../utils/db', () => ({
  prisma: {
    resource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Resources Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/resources', resourcesRoutes);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/resources/search', () => {
    const mockResources = [
      {
        id: 'resource-1',
        title: 'Introduction to React',
        description: 'Learn React basics',
        url: 'https://example.com/react',
        type: 'article',
        difficulty: 'beginner',
        pricing: 'free',
        platform: 'Medium',
        qualityScore: 85,
        rating: 4.5,
        viewCount: 1000,
      },
      {
        id: 'resource-2',
        title: 'Advanced React Patterns',
        description: 'Deep dive into React',
        url: 'https://example.com/react-advanced',
        type: 'video',
        difficulty: 'advanced',
        pricing: 'paid',
        platform: 'YouTube',
        qualityScore: 90,
        rating: 4.8,
        viewCount: 5000,
      },
    ];

    it('should search resources without filters', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue(mockResources);
      (prisma.resource.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app).get('/api/resources/search');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.resources).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.limit).toBe(20);
      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.pagination.hasMore).toBe(false);
    });

    it('should search resources by query string', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?query=React');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ title: { contains: 'React' } }, { description: { contains: 'React' } }],
          }),
        })
      );
    });

    it('should filter by type', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?type=article');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'article',
          }),
        })
      );
    });

    it('should filter by difficulty', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?difficulty=beginner');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: 'beginner',
          }),
        })
      );
    });

    it('should filter by pricing', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?pricing=free');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricing: 'free',
          }),
        })
      );
    });

    it('should filter by platform', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?platform=Medium');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            platform: { contains: 'Medium' },
          }),
        })
      );
    });

    it('should filter by minQualityScore', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[1]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/resources/search?minQualityScore=90');

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            qualityScore: { gte: 90 },
          }),
        })
      );
    });

    it('should apply multiple filters', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get(
        '/api/resources/search?query=React&type=article&difficulty=beginner&pricing=free&minQualityScore=80'
      );

      expect(response.status).toBe(200);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            type: 'article',
            difficulty: 'beginner',
            pricing: 'free',
            qualityScore: { gte: 80 },
          }),
        })
      );
    });

    it('should handle pagination with limit and offset', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([mockResources[0]]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(50);

      const response = await request(app).get('/api/resources/search?limit=10&offset=20');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.offset).toBe(20);
      expect(response.body.data.pagination.hasMore).toBe(true);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should reject query that is too short', async () => {
      const response = await request(app).get('/api/resources/search?query=a');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid minQualityScore', async () => {
      const response = await request(app).get('/api/resources/search?minQualityScore=150');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject limit exceeding max', async () => {
      const response = await request(app).get('/api/resources/search?limit=200');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject negative offset', async () => {
      const response = await request(app).get('/api/resources/search?offset=-1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle empty search results', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resource.count as jest.Mock).mockResolvedValue(0);

      const response = await request(app).get('/api/resources/search?query=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.data.resources).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should order by quality score, rating, and view count', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue(mockResources);
      (prisma.resource.count as jest.Mock).mockResolvedValue(2);

      await request(app).get('/api/resources/search');

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ qualityScore: 'desc' }, { rating: 'desc' }, { viewCount: 'desc' }],
        })
      );
    });

    it('should handle database errors', async () => {
      (prisma.resource.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/resources/search');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/resources/:id', () => {
    const mockResource = {
      id: 'resource-1',
      title: 'Introduction to React',
      description: 'Learn React basics',
      url: 'https://example.com/react',
      type: 'article',
      difficulty: 'beginner',
      pricing: 'free',
      platform: 'Medium',
      qualityScore: 85,
      topics: [
        {
          topicId: 'topic-1',
          resourceId: 'resource-1',
          relevanceScore: 95,
          topic: {
            id: 'topic-1',
            name: 'React Hooks',
          },
        },
      ],
    };

    it('should return resource details', async () => {
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);

      const response = await request(app).get('/api/resources/resource-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('resource-1');
      expect(response.body.data.title).toBe('Introduction to React');
      expect(response.body.data.topics).toHaveLength(1);
      expect(prisma.resource.findUnique).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
        include: {
          topics: {
            include: {
              topic: true,
            },
          },
        },
      });
    });

    it('should return 404 when resource not found', async () => {
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/resources/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Resource not found');
    });

    it('should handle database errors', async () => {
      (prisma.resource.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/resources/resource-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/resources/stats/overview', () => {
    const mockStats = {
      totalResources: 100,
      byType: [
        { type: 'article', _count: 40 },
        { type: 'video', _count: 35 },
        { type: 'course', _count: 25 },
      ],
      byDifficulty: [
        { difficulty: 'beginner', _count: 50 },
        { difficulty: 'intermediate', _count: 30 },
        { difficulty: 'advanced', _count: 20 },
      ],
      byPricing: [
        { pricing: 'free', _count: 70 },
        { pricing: 'paid', _count: 30 },
      ],
      avgQualityScore: {
        _avg: {
          qualityScore: 75.5,
        },
      },
    };

    it('should return overview statistics', async () => {
      (prisma.resource.count as jest.Mock).mockResolvedValue(mockStats.totalResources);
      (prisma.resource.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.byType)
        .mockResolvedValueOnce(mockStats.byDifficulty)
        .mockResolvedValueOnce(mockStats.byPricing);
      (prisma.resource.aggregate as jest.Mock).mockResolvedValue(mockStats.avgQualityScore);

      const response = await request(app).get('/api/resources/stats/overview');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalResources).toBe(100);
      expect(response.body.data.byType).toEqual([
        { type: 'article', count: 40 },
        { type: 'video', count: 35 },
        { type: 'course', count: 25 },
      ]);
      expect(response.body.data.byDifficulty).toEqual([
        { difficulty: 'beginner', count: 50 },
        { difficulty: 'intermediate', count: 30 },
        { difficulty: 'advanced', count: 20 },
      ]);
      expect(response.body.data.byPricing).toEqual([
        { pricing: 'free', count: 70 },
        { pricing: 'paid', count: 30 },
      ]);
      expect(response.body.data.averageQualityScore).toBe(75.5);
    });

    it('should handle empty database (no resources)', async () => {
      (prisma.resource.count as jest.Mock).mockResolvedValue(0);
      (prisma.resource.groupBy as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (prisma.resource.aggregate as jest.Mock).mockResolvedValue({
        _avg: { qualityScore: null },
      });

      const response = await request(app).get('/api/resources/stats/overview');

      expect(response.status).toBe(200);
      expect(response.body.data.totalResources).toBe(0);
      expect(response.body.data.byType).toEqual([]);
      expect(response.body.data.averageQualityScore).toBe(0);
    });

    it('should handle database errors', async () => {
      (prisma.resource.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/resources/stats/overview');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
