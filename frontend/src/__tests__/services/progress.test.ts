import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressApi } from '../../services/progress';
import * as apiModule from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('progressApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProgress', () => {
    it('calls POST /progress with complete data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'entry-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'in_progress' as const,
            notes: 'Starting this resource',
            timeSpent: 15,
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: null,
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = {
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'in_progress' as const,
        notes: 'Starting this resource',
        timeSpent: 15,
      };

      const result = await progressApi.createProgress(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/progress', requestData);
      expect(result).toEqual(mockResponse.data);
    });

    it('creates progress with minimal data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'entry-2',
            planId: 'plan-1',
            resourceId: 'resource-2',
            status: 'not_started' as const,
            notes: null,
            timeSpent: null,
            startedAt: null,
            completedAt: null,
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = {
        planId: 'plan-1',
        resourceId: 'resource-2',
        status: 'not_started' as const,
      };

      const result = await progressApi.createProgress(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/progress', requestData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPlanProgress', () => {
    it('calls GET /progress/:planId', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            planId: 'plan-1',
            progressEntries: [
              {
                id: 'entry-1',
                planId: 'plan-1',
                resourceId: 'resource-1',
                status: 'completed' as const,
                notes: 'Finished',
                timeSpent: 30,
                startedAt: '2024-01-01T10:00:00Z',
                completedAt: '2024-01-01T10:30:00Z',
                createdAt: '2024-01-01T10:00:00Z',
                updatedAt: '2024-01-01T10:30:00Z',
              },
            ],
            summary: {
              totalResources: 5,
              completedCount: 1,
              inProgressCount: 2,
              notStartedCount: 2,
              totalTimeSpent: 30,
              completionPercentage: 20,
            },
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await progressApi.getPlanProgress('plan-1');

      expect(apiModule.api.get).toHaveBeenCalledWith('/progress/plan-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateProgress', () => {
    it('calls PATCH /progress/:planId/:resourceId with status update', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'entry-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'completed' as const,
            notes: null,
            timeSpent: null,
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: '2024-01-01T11:00:00Z',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T11:00:00Z',
          },
        },
      };

      vi.mocked(apiModule.api.patch).mockResolvedValue(mockResponse);

      const updateData = { status: 'completed' as const };
      const result = await progressApi.updateProgress('plan-1', 'resource-1', updateData);

      expect(apiModule.api.patch).toHaveBeenCalledWith(
        '/progress/plan-1/resource-1',
        updateData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('calls PATCH with notes update', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'entry-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'in_progress' as const,
            notes: 'Updated notes here',
            timeSpent: 45,
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: null,
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:45:00Z',
          },
        },
      };

      vi.mocked(apiModule.api.patch).mockResolvedValue(mockResponse);

      const updateData = {
        notes: 'Updated notes here',
        timeSpent: 45,
      };
      const result = await progressApi.updateProgress('plan-1', 'resource-1', updateData);

      expect(apiModule.api.patch).toHaveBeenCalledWith(
        '/progress/plan-1/resource-1',
        updateData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getOverallStats', () => {
    it('calls GET /progress/stats', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            totalPlans: 3,
            totalResources: 15,
            completedResources: 5,
            inProgressResources: 4,
            notStartedResources: 6,
            totalTimeSpent: 120,
            averageCompletionRate: 33.3,
            recentActivity: [
              {
                id: 'entry-1',
                planId: 'plan-1',
                resourceTitle: 'React Basics',
                status: 'completed',
                updatedAt: '2024-01-01T10:00:00Z',
              },
            ],
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await progressApi.getOverallStats();

      expect(apiModule.api.get).toHaveBeenCalledWith('/progress/stats');
      expect(result).toEqual(mockResponse.data);
    });
  });
});
