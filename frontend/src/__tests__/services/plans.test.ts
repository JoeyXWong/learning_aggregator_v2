import { describe, it, expect, vi, beforeEach } from 'vitest';
import { plansApi } from '../../services/plans';
import * as apiModule from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('plansApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePlan', () => {
    it('calls POST /plans/generate with preferences', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'plan-1',
            topicId: 'topic-1',
            title: 'React Learning Plan',
            preferences: { pace: 'moderate', freeOnly: true },
            phases: [],
            totalDuration: 40,
            completionPercentage: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = {
        topicId: 'topic-1',
        preferences: {
          pace: 'moderate' as const,
          freeOnly: true,
          preferredTypes: ['video', 'article'],
        },
      };

      const result = await plansApi.generatePlan(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/plans/generate', requestData);
      expect(result).toEqual(mockResponse.data);
    });

    it('generates plan without preferences', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'plan-2',
            topicId: 'topic-2',
            title: 'Vue Learning Plan',
            preferences: {},
            phases: [],
            totalDuration: 30,
            completionPercentage: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        },
      };

      vi.mocked(apiModule.api.post).mockResolvedValue(mockResponse);

      const requestData = { topicId: 'topic-2' };
      const result = await plansApi.generatePlan(requestData);

      expect(apiModule.api.post).toHaveBeenCalledWith('/plans/generate', requestData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPlan', () => {
    it('calls GET /plans/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'plan-1',
            topicId: 'topic-1',
            title: 'React Learning Plan',
            preferences: {},
            phases: [],
            totalDuration: 40,
            completionPercentage: 25,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await plansApi.getPlan('plan-1');

      expect(apiModule.api.get).toHaveBeenCalledWith('/plans/plan-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listPlans', () => {
    it('calls GET /plans', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            plans: [
              {
                id: 'plan-1',
                topicId: 'topic-1',
                title: 'React Plan',
                preferences: {},
                phases: [],
                totalDuration: 40,
                completionPercentage: 0,
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              },
            ],
            count: 1,
          },
        },
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await plansApi.listPlans();

      expect(apiModule.api.get).toHaveBeenCalledWith('/plans');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deletePlan', () => {
    it('calls DELETE /plans/:id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Plan deleted successfully',
        },
      };

      vi.mocked(apiModule.api.delete).mockResolvedValue(mockResponse);

      const result = await plansApi.deletePlan('plan-1');

      expect(apiModule.api.delete).toHaveBeenCalledWith('/plans/plan-1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('exportPlan', () => {
    it('calls GET /plans/:id/export with markdown format', async () => {
      const mockBlob = new Blob(['# Plan content'], { type: 'text/markdown' });
      const mockResponse = {
        data: mockBlob,
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await plansApi.exportPlan('plan-1', 'markdown');

      expect(apiModule.api.get).toHaveBeenCalledWith('/plans/plan-1/export', {
        params: { format: 'markdown' },
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });

    it('defaults to markdown format when not specified', async () => {
      const mockBlob = new Blob(['# Plan content'], { type: 'text/markdown' });
      const mockResponse = {
        data: mockBlob,
      };

      vi.mocked(apiModule.api.get).mockResolvedValue(mockResponse);

      const result = await plansApi.exportPlan('plan-1');

      expect(apiModule.api.get).toHaveBeenCalledWith('/plans/plan-1/export', {
        params: { format: 'markdown' },
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });
  });
});
