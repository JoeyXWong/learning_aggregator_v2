import { AggregatorService } from '../aggregator.service';
import { youtubeService } from '../youtube.service';
import { githubService } from '../github.service';
import { classifierService } from '../classifier.service';
import { prisma } from '../../utils/db';

// Mock services
jest.mock('../youtube.service');
jest.mock('../github.service');
jest.mock('../classifier.service');
jest.mock('../../utils/db', () => ({
  prisma: {
    topic: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    resource: {
      upsert: jest.fn(),
    },
    topicResource: {
      upsert: jest.fn(),
      findMany: jest.fn(),
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

describe('AggregatorService', () => {
  let aggregatorService: AggregatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    aggregatorService = new AggregatorService();
  });

  describe('aggregateResources', () => {
    it('should successfully aggregate resources from all sources', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockYoutubeResources = [
        {
          id: 'video1',
          title: 'React Tutorial',
          description: 'Learn React',
          url: 'https://youtube.com/watch?v=123',
          duration: 30,
          viewCount: 10000,
          rating: 4.5,
          thumbnailUrl: 'thumb.jpg',
          publishDate: new Date(),
          channelTitle: 'Tech Channel',
        },
      ];

      const mockGithubResources = [
        {
          id: 'repo1',
          title: 'facebook/react',
          description: 'React library',
          url: 'https://github.com/facebook/react',
          stars: 200000,
          lastUpdated: new Date(),
          language: 'JavaScript',
          topics: ['react'],
          ownerName: 'facebook',
          isArchived: false,
        },
      ];

      const mockClassifiedResources = [
        {
          url: 'https://youtube.com/watch?v=123',
          title: 'React Tutorial',
          description: 'Learn React',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          duration: 30,
          qualityScore: 75,
          normalizedUrl: 'https://youtube.com/watch?v=123',
        },
        {
          url: 'https://github.com/facebook/react',
          title: 'facebook/react',
          description: 'React library',
          type: 'repository',
          difficulty: 'intermediate',
          pricing: 'free',
          platform: 'github.com',
          qualityScore: 90,
          normalizedUrl: 'https://github.com/facebook/react',
        },
      ];

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue(
        mockYoutubeResources
      );
      (githubService.searchRepositories as jest.Mock).mockResolvedValue(
        mockGithubResources
      );
      (classifierService.classifyBatch as jest.Mock).mockReturnValue(
        mockClassifiedResources
      );
      (prisma.resource.upsert as jest.Mock).mockResolvedValue({
        id: 'resource-123',
      });
      (prisma.topicResource.upsert as jest.Mock).mockResolvedValue({});
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      const result = await aggregatorService.aggregateResources('React');

      expect(result.topicId).toBe('topic-123');
      expect(result.resourceCount).toBe(2);
      expect(result.sources.youtube).toBe(1);
      expect(result.sources.github).toBe(1);
      expect(result.averageQualityScore).toBeGreaterThan(0);
    });

    it('should return cached results when available', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 5,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cachedResult = {
        topicId: 'topic-123',
        resourceCount: 5,
        sources: { youtube: 3, github: 2 },
        averageQualityScore: 80,
      };

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);

      // First call to populate cache
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue([]);
      (githubService.searchRepositories as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue([]);
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      await aggregatorService.aggregateResources('React');

      // Set cache manually for testing
      (aggregatorService as any).setCache('topic:topic-123', cachedResult);

      // Second call should use cache
      const result = await aggregatorService.aggregateResources('React');

      expect(result).toEqual(cachedResult);
      expect(youtubeService.searchVideos).toHaveBeenCalledTimes(1); // Only from first call
    });

    it('should filter resources by quality score', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockClassifiedResources = [
        {
          url: 'https://example.com/high-quality',
          title: 'High Quality Resource',
          description: 'Great resource',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          qualityScore: 85,
          normalizedUrl: 'https://example.com/high-quality',
        },
        {
          url: 'https://example.com/low-quality',
          title: 'Low Quality Resource',
          description: 'Poor resource',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          qualityScore: 20,
          normalizedUrl: 'https://example.com/low-quality',
        },
      ];

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue([]);
      (githubService.searchRepositories as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue(
        mockClassifiedResources
      );
      (prisma.resource.upsert as jest.Mock).mockResolvedValue({
        id: 'resource-123',
      });
      (prisma.topicResource.upsert as jest.Mock).mockResolvedValue({});
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      const result = await aggregatorService.aggregateResources('React', {
        minQualityScore: 50,
      });

      expect(result.resourceCount).toBe(1); // Only high quality resource
    });

    it('should deduplicate resources', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicateResources = [
        {
          url: 'https://example.com/resource',
          title: 'Resource 1',
          description: 'Description',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          qualityScore: 70,
          normalizedUrl: 'https://example.com/resource',
        },
        {
          url: 'https://example.com/resource',
          title: 'Resource 2',
          description: 'Description',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          qualityScore: 80,
          normalizedUrl: 'https://example.com/resource',
        },
      ];

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue([]);
      (githubService.searchRepositories as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue(
        duplicateResources
      );
      (prisma.resource.upsert as jest.Mock).mockResolvedValue({
        id: 'resource-123',
      });
      (prisma.topicResource.upsert as jest.Mock).mockResolvedValue({});
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      const result = await aggregatorService.aggregateResources('React');

      expect(result.resourceCount).toBe(1); // Duplicates removed, higher quality kept
    });

    it('should handle YouTube service unavailable', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(false);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.searchRepositories as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue([]);
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      await aggregatorService.aggregateResources('React');

      expect(youtubeService.searchVideos).not.toHaveBeenCalled();
    });

    it('should handle GitHub service unavailable', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(false);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue([]);
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      await aggregatorService.aggregateResources('React');

      expect(githubService.searchRepositories).not.toHaveBeenCalled();
    });

    it('should respect includeYouTube option', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.searchRepositories as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue([]);
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      await aggregatorService.aggregateResources('React', {
        includeYouTube: false,
      });

      expect(youtubeService.searchVideos).not.toHaveBeenCalled();
    });

    it('should respect includeGitHub option', async () => {
      const mockTopic = {
        id: 'topic-123',
        name: 'React',
        normalizedName: 'react',
        slug: 'react',
        resourceCount: 0,
        lastAggregatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);
      (youtubeService.isAvailable as jest.Mock).mockReturnValue(true);
      (githubService.isAvailable as jest.Mock).mockReturnValue(true);
      (youtubeService.searchVideos as jest.Mock).mockResolvedValue([]);
      (classifierService.classifyBatch as jest.Mock).mockReturnValue([]);
      (prisma.topic.update as jest.Mock).mockResolvedValue(mockTopic);

      await aggregatorService.aggregateResources('React', {
        includeGitHub: false,
      });

      expect(githubService.searchRepositories).not.toHaveBeenCalled();
    });

    it('should handle errors during aggregation', async () => {
      (prisma.topic.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        aggregatorService.aggregateResources('React')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTopicResources', () => {
    it('should retrieve resources with filters', async () => {
      const mockResources = [
        {
          resource: {
            id: 'resource-1',
            url: 'https://example.com/1',
            normalizedUrl: 'https://example.com/1',
            title: 'Resource 1',
            description: 'Description 1',
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
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      (prisma.topicResource.findMany as jest.Mock).mockResolvedValue(
        mockResources
      );

      const filters = {
        type: 'video',
        difficulty: 'beginner',
        pricing: 'free',
        minQualityScore: 50,
      };

      const resources = await aggregatorService.getTopicResources(
        'topic-123',
        filters
      );

      expect(resources).toHaveLength(1);
      expect(resources[0].type).toBe('video');
      expect(prisma.topicResource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            topicId: 'topic-123',
            resource: expect.objectContaining({
              type: 'video',
              difficulty: 'beginner',
              pricing: 'free',
              qualityScore: { gte: 50 },
            }),
          }),
        })
      );
    });

    it('should retrieve resources without filters', async () => {
      const mockResources = [
        {
          resource: {
            id: 'resource-1',
            url: 'https://example.com/1',
            normalizedUrl: 'https://example.com/1',
            title: 'Resource 1',
            description: 'Description 1',
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
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      (prisma.topicResource.findMany as jest.Mock).mockResolvedValue(
        mockResources
      );

      const resources = await aggregatorService.getTopicResources('topic-123');

      expect(resources).toHaveLength(1);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for a specific topic', () => {
      (aggregatorService as any).setCache('topic:topic-123', {
        topicId: 'topic-123',
        resourceCount: 5,
        sources: { youtube: 3, github: 2 },
        averageQualityScore: 80,
      });

      aggregatorService.clearCache('topic-123');

      const cached = (aggregatorService as any).getFromCache('topic:topic-123');
      expect(cached).toBeNull();
    });
  });

  describe('cache management', () => {
    it('should return null for expired cache', () => {
      const expiredTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      (aggregatorService as any).cache.set('topic:topic-123', {
        timestamp: expiredTimestamp,
        data: { topicId: 'topic-123', resourceCount: 5 },
      });

      const cached = (aggregatorService as any).getFromCache('topic:topic-123');
      expect(cached).toBeNull();
    });

    it('should return valid cache within TTL', () => {
      const validData = {
        topicId: 'topic-123',
        resourceCount: 5,
        sources: { youtube: 3, github: 2 },
        averageQualityScore: 80,
      };

      (aggregatorService as any).setCache('topic:topic-123', validData);

      const cached = (aggregatorService as any).getFromCache('topic:topic-123');
      expect(cached).toEqual(validData);
    });
  });

  describe('storeResources', () => {
    it('should store resources in database', async () => {
      const classifiedResources = [
        {
          url: 'https://example.com/resource',
          title: 'Test Resource',
          description: 'Test Description',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          duration: 30,
          qualityScore: 75,
          normalizedUrl: 'https://example.com/resource',
          rating: 4.5,
          viewCount: 1000,
          publishDate: new Date(),
          lastUpdated: new Date(),
        },
      ];

      (prisma.resource.upsert as jest.Mock).mockResolvedValue({
        id: 'resource-123',
      });
      (prisma.topicResource.upsert as jest.Mock).mockResolvedValue({});

      await (aggregatorService as any).storeResources(
        'topic-123',
        classifiedResources
      );

      expect(prisma.resource.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.topicResource.upsert).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors during storage', async () => {
      const classifiedResources = [
        {
          url: 'https://example.com/resource',
          title: 'Test Resource',
          description: 'Test Description',
          type: 'video',
          difficulty: 'beginner',
          pricing: 'free',
          platform: 'youtube.com',
          duration: 30,
          qualityScore: 75,
          normalizedUrl: 'https://example.com/resource',
        },
      ];

      (prisma.resource.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        (aggregatorService as any).storeResources('topic-123', classifiedResources)
      ).rejects.toThrow('Database error');
    });
  });
});
