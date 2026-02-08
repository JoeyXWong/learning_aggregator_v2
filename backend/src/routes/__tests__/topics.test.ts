import request from 'supertest';
import express, { Application } from 'express';
import topicsRoutes from '../topics';
import { aggregatorService } from '../../services/aggregator.service';
import { prisma } from '../../utils/db';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the aggregator service
jest.mock('../../services/aggregator.service');

// Mock prisma
jest.mock('../../utils/db', () => ({
  prisma: {
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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

describe('Topics Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/topics', topicsRoutes);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/topics', () => {
    const mockAggregationResult = {
      topicId: 'topic-1',
      resourceCount: 15,
      sources: {
        youtube: 8,
        github: 7,
      },
      averageQualityScore: 75.5,
    };

    it('should create a topic and aggregate resources successfully', async () => {
      (aggregatorService.aggregateResources as jest.Mock).mockResolvedValue(
        mockAggregationResult
      );

      const response = await request(app).post('/api/topics').send({
        name: 'React Hooks',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Resources aggregated successfully');
      expect(response.body.data.topicId).toBe('topic-1');
      expect(response.body.data.resourceCount).toBe(15);
      expect(aggregatorService.aggregateResources).toHaveBeenCalledWith('React Hooks', undefined);
    });

    it('should create a topic with custom options', async () => {
      (aggregatorService.aggregateResources as jest.Mock).mockResolvedValue(
        mockAggregationResult
      );

      const response = await request(app).post('/api/topics').send({
        name: 'TypeScript',
        options: {
          maxResourcesPerSource: 30,
          includeYouTube: true,
          includeGitHub: false,
          minQualityScore: 80,
        },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(aggregatorService.aggregateResources).toHaveBeenCalledWith('TypeScript', {
        maxResourcesPerSource: 30,
        includeYouTube: true,
        includeGitHub: false,
        minQualityScore: 80,
      });
    });

    it('should reject topic name that is too short', async () => {
      const response = await request(app).post('/api/topics').send({
        name: 'a',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request data');
    });

    it('should reject topic name that is too long', async () => {
      const response = await request(app).post('/api/topics').send({
        name: 'a'.repeat(201),
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing name field', async () => {
      const response = await request(app).post('/api/topics').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid options', async () => {
      const response = await request(app).post('/api/topics').send({
        name: 'Valid Topic',
        options: {
          maxResourcesPerSource: 200, // exceeds max of 50
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should trim whitespace from topic name', async () => {
      (aggregatorService.aggregateResources as jest.Mock).mockResolvedValue(
        mockAggregationResult
      );

      const response = await request(app).post('/api/topics').send({
        name: '  React Hooks  ',
      });

      expect(response.status).toBe(201);
      expect(aggregatorService.aggregateResources).toHaveBeenCalledWith('React Hooks', undefined);
    });

    it('should handle aggregation service errors', async () => {
      (aggregatorService.aggregateResources as jest.Mock).mockRejectedValue(
        new Error('External API failed')
      );

      const response = await request(app).post('/api/topics').send({
        name: 'React Hooks',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/topics/:id/resources', () => {
    const mockResources = [
      {
        id: 'resource-1',
        title: 'Introduction to React',
        url: 'https://example.com/react-intro',
        type: 'article',
        difficulty: 'beginner',
        pricing: 'free',
        qualityScore: 85,
      },
      {
        id: 'resource-2',
        title: 'Advanced React Patterns',
        url: 'https://example.com/react-advanced',
        type: 'video',
        difficulty: 'advanced',
        pricing: 'paid',
        qualityScore: 90,
      },
    ];

    it('should return resources for a topic', async () => {
      (aggregatorService.getTopicResources as jest.Mock).mockResolvedValue(mockResources);

      const response = await request(app).get('/api/topics/topic-1/resources');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topicId).toBe('topic-1');
      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.resources).toHaveLength(2);
      expect(response.body.data.groupedByType).toBeDefined();
      expect(response.body.data.metadata).toBeDefined();
      expect(aggregatorService.getTopicResources).toHaveBeenCalledWith('topic-1', {});
    });

    it('should filter resources by type', async () => {
      const filteredResources = [mockResources[0]];
      (aggregatorService.getTopicResources as jest.Mock).mockResolvedValue(filteredResources);

      const response = await request(app).get('/api/topics/topic-1/resources?type=article');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.type).toBe('article');
      expect(aggregatorService.getTopicResources).toHaveBeenCalledWith('topic-1', {
        type: 'article',
      });
    });

    it('should filter resources by multiple criteria', async () => {
      (aggregatorService.getTopicResources as jest.Mock).mockResolvedValue([mockResources[0]]);

      const response = await request(app).get(
        '/api/topics/topic-1/resources?type=article&difficulty=beginner&pricing=free&minQualityScore=80'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.filters).toEqual({
        type: 'article',
        difficulty: 'beginner',
        pricing: 'free',
        minQualityScore: 80,
      });
    });

    it('should reject invalid minQualityScore', async () => {
      const response = await request(app).get(
        '/api/topics/topic-1/resources?minQualityScore=150'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle empty resource list', async () => {
      (aggregatorService.getTopicResources as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/topics/topic-1/resources');

      expect(response.status).toBe(200);
      expect(response.body.data.totalCount).toBe(0);
      expect(response.body.data.resources).toHaveLength(0);
    });

    it('should group resources by type', async () => {
      (aggregatorService.getTopicResources as jest.Mock).mockResolvedValue(mockResources);

      const response = await request(app).get('/api/topics/topic-1/resources');

      expect(response.body.data.groupedByType.article).toHaveLength(1);
      expect(response.body.data.groupedByType.video).toHaveLength(1);
      expect(response.body.data.metadata.types).toContainEqual({ type: 'article', count: 1 });
      expect(response.body.data.metadata.types).toContainEqual({ type: 'video', count: 1 });
    });

    it('should handle service errors', async () => {
      (aggregatorService.getTopicResources as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/topics/topic-1/resources');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/topics/:id', () => {
    const mockTopic = {
      id: 'topic-1',
      name: 'React Hooks',
      lastAggregatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        resources: 15,
      },
    };

    it('should return topic details', async () => {
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(mockTopic);

      const response = await request(app).get('/api/topics/topic-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('topic-1');
      expect(response.body.data.name).toBe('React Hooks');
      expect(response.body.data._count.resources).toBe(15);
      expect(prisma.topic.findUnique).toHaveBeenCalledWith({
        where: { id: 'topic-1' },
        include: {
          _count: {
            select: { resources: true },
          },
        },
      });
    });

    it('should return 404 when topic not found', async () => {
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/topics/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Topic not found');
    });

    it('should handle database errors', async () => {
      (prisma.topic.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/topics/topic-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/topics', () => {
    const mockTopics = [
      {
        id: 'topic-1',
        name: 'React Hooks',
        lastAggregatedAt: new Date('2024-02-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { resources: 15 },
      },
      {
        id: 'topic-2',
        name: 'TypeScript',
        lastAggregatedAt: new Date('2024-02-02'),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { resources: 20 },
      },
    ];

    it('should list all topics', async () => {
      (prisma.topic.findMany as jest.Mock).mockResolvedValue(mockTopics);

      const response = await request(app).get('/api/topics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.topics).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
      expect(prisma.topic.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when no topics exist', async () => {
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/topics');

      expect(response.status).toBe(200);
      expect(response.body.data.topics).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });

    it('should handle database errors', async () => {
      (prisma.topic.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/topics');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/topics/:id/cache', () => {
    it('should clear cache for a topic', async () => {
      (aggregatorService.clearCache as jest.Mock).mockReturnValue(undefined);

      const response = await request(app).delete('/api/topics/topic-1/cache');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache cleared successfully');
      expect(aggregatorService.clearCache).toHaveBeenCalledWith('topic-1');
    });

    it('should handle any topic ID (cache may not exist)', async () => {
      (aggregatorService.clearCache as jest.Mock).mockReturnValue(undefined);

      const response = await request(app).delete('/api/topics/nonexistent/cache');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
