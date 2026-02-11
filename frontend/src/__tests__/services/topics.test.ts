import { describe, it, expect, vi, beforeEach } from 'vitest';
import { topicsApi } from '../../services/topics';
import * as apiModule from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('topicsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTopic', () => {
    it('calls POST /topics with correct data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            topicId: 'topic-1',
            resourceCount: 10,
            sources: { youtube: 5, github: 5 },
            averageQualityScore: 8.5,
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = {
        name: 'React Testing',
        options: {
          maxResourcesPerSource: 10,
          includeYouTube: true,
          includeGitHub: true,
        },
      };

      const result = await topicsApi.createTopic(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/topics', requestData);
      expect(result).toEqual(mockResponse.data);
    });

    it('creates topic without options', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            topicId: 'topic-2',
            resourceCount: 5,
            sources: { youtube: 3, github: 2 },
            averageQualityScore: 7.0,
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = { name: 'Vue.js' };
      const result = await topicsApi.createTopic(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/topics', requestData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTopicResources', () => {
    it('calls GET /topics/:id/resources with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            topicId: 'topic-1',
            totalCount: 15,
            filters: { type: 'video', difficulty: 'beginner' },
            resources: [],
            groupedByType: {},
            metadata: {
              types: [],
              difficulties: [],
              pricing: [],
            },
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const filters = {
        type: 'video',
        difficulty: 'beginner',
        pricing: 'free',
        minQualityScore: 7,
      };

      const result = await topicsApi.getTopicResources('topic-1', filters);

      expect(apiModule.api.get).toHaveBeenCalledWith('/topics/topic-1/resources', {
        params: filters,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('calls GET /topics/:id/resources without filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            topicId: 'topic-1',
            totalCount: 20,
            filters: {},
            resources: [],
            groupedByType: {},
            metadata: {
              types: [],
              difficulties: [],
              pricing: [],
            },
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await topicsApi.getTopicResources('topic-1');

      expect(apiModule.api.get).toHaveBeenCalledWith('/topics/topic-1/resources', {
        params: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTopic', () => {
    it('calls GET /topics/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'topic-1',
            name: 'React',
            createdAt: '2024-01-01',
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await topicsApi.getTopic('topic-1');

      expect(apiModule.api.get).toHaveBeenCalledWith('/topics/topic-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listTopics', () => {
    it('calls GET /topics', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            topics: [
              { id: 'topic-1', name: 'React' },
              { id: 'topic-2', name: 'Vue' },
            ],
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await topicsApi.listTopics();

      expect(apiModule.api.get).toHaveBeenCalledWith('/topics');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('clearCache', () => {
    it('calls DELETE /topics/:id/cache', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Cache cleared',
        },
      };

      vi.mocked(apiModule.api.delete).mockResolvedValue(mockResponse);

      const result = await topicsApi.clearCache('topic-1');

      expect(apiModule.api.delete).toHaveBeenCalledWith('/topics/topic-1/cache');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
