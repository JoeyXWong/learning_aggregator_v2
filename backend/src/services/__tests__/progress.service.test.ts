import { progressService, type UpdateProgressParams } from '../progress.service';
import { prisma } from '../../utils/db';

// Mock prisma
jest.mock('../../utils/db', () => ({
  prisma: {
    learningPlan: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    resource: {
      findUnique: jest.fn(),
    },
    progressEntry: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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

describe('ProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProgress', () => {
    const mockPlan = {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'Test Plan',
      preferences: '{}',
      phases: '[]',
      totalDuration: 10,
      completionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResource = {
      id: 'resource-1',
      title: 'Test Resource',
      url: 'https://example.com',
      normalizedUrl: 'https://example.com',
      type: 'article',
      difficulty: 'beginner',
      pricing: 'free',
      platform: 'example',
      duration: 30,
      rating: null,
      reviewCount: null,
      viewCount: null,
      publishDate: null,
      lastUpdatedDate: null,
      lastVerifiedAt: null,
      qualityScore: 75,
      thumbnailUrl: null,
      metadata: '{}',
      description: 'Test description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProgressEntry = {
      id: 'progress-1',
      planId: 'plan-1',
      resourceId: 'resource-1',
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      notes: 'Test notes',
      timeSpent: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      resource: {
        id: mockResource.id,
        title: mockResource.title,
        url: mockResource.url,
        type: mockResource.type,
        difficulty: mockResource.difficulty,
        duration: mockResource.duration,
      },
    };

    it('should create a new progress entry', async () => {
      const params: UpdateProgressParams = {
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'in_progress',
        notes: 'Test notes',
        timeSpent: 15,
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (prisma.progressEntry.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.progressEntry.upsert as jest.Mock).mockResolvedValue(mockProgressEntry);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce(mockPlan);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockPlan,
        progressEntries: [mockProgressEntry],
      });

      const result = await progressService.updateProgress(params);

      expect(result).toEqual(mockProgressEntry);
      expect(prisma.progressEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            planId_resourceId: {
              planId: 'plan-1',
              resourceId: 'resource-1',
            },
          },
          create: expect.objectContaining({
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'in_progress',
            notes: 'Test notes',
            timeSpent: 15,
          }),
        })
      );
    });

    it('should update an existing progress entry', async () => {
      const params: UpdateProgressParams = {
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'completed',
        notes: 'Updated notes',
        timeSpent: 30,
      };

      const existingEntry = {
        ...mockProgressEntry,
        status: 'in_progress',
        startedAt: new Date('2024-01-01'),
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (prisma.progressEntry.findUnique as jest.Mock).mockResolvedValue(existingEntry);
      (prisma.progressEntry.upsert as jest.Mock).mockResolvedValue({
        ...mockProgressEntry,
        status: 'completed',
        completedAt: new Date(),
      });
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce(mockPlan);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockPlan,
        progressEntries: [mockProgressEntry],
      });

      const result = await progressService.updateProgress(params);

      expect(result.status).toBe('completed');
      expect(prisma.progressEntry.upsert).toHaveBeenCalled();
    });

    it('should set startedAt when transitioning from not_started to in_progress', async () => {
      const params: UpdateProgressParams = {
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'in_progress',
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (prisma.progressEntry.findUnique as jest.Mock).mockResolvedValue({
        ...mockProgressEntry,
        status: 'not_started',
        startedAt: null,
      });
      (prisma.progressEntry.upsert as jest.Mock).mockResolvedValue(mockProgressEntry);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce(mockPlan);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockPlan,
        progressEntries: [mockProgressEntry],
      });

      await progressService.updateProgress(params);

      const upsertCall = (prisma.progressEntry.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update.startedAt).toBeDefined();
    });

    it('should set completedAt when transitioning to completed', async () => {
      const params: UpdateProgressParams = {
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'completed',
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (prisma.progressEntry.findUnique as jest.Mock).mockResolvedValue({
        ...mockProgressEntry,
        status: 'in_progress',
        completedAt: null,
      });
      (prisma.progressEntry.upsert as jest.Mock).mockResolvedValue({
        ...mockProgressEntry,
        status: 'completed',
        completedAt: new Date(),
      });
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce(mockPlan);
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockPlan,
        progressEntries: [mockProgressEntry],
      });

      await progressService.updateProgress(params);

      const upsertCall = (prisma.progressEntry.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update.completedAt).toBeDefined();
    });

    it('should throw error if plan not found', async () => {
      const params: UpdateProgressParams = {
        planId: 'invalid-plan',
        resourceId: 'resource-1',
        status: 'in_progress',
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(progressService.updateProgress(params)).rejects.toThrow(
        'Learning plan not found'
      );
    });

    it('should throw error if resource not found', async () => {
      const params: UpdateProgressParams = {
        planId: 'plan-1',
        resourceId: 'invalid-resource',
        status: 'in_progress',
      };

      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(progressService.updateProgress(params)).rejects.toThrow(
        'Resource not found'
      );
    });
  });

  describe('getProgressByPlan', () => {
    const mockPlan = {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'Test Plan',
      preferences: '{}',
      phases: '[]',
      totalDuration: 10,
      completionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProgressEntries = [
      {
        id: 'progress-1',
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        notes: 'Finished',
        timeSpent: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        resource: {
          id: 'resource-1',
          title: 'Resource 1',
          url: 'https://example.com/1',
          type: 'article',
          difficulty: 'beginner',
          duration: 30,
        },
      },
      {
        id: 'progress-2',
        planId: 'plan-1',
        resourceId: 'resource-2',
        status: 'in_progress',
        startedAt: new Date(),
        completedAt: null,
        notes: null,
        timeSpent: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        resource: {
          id: 'resource-2',
          title: 'Resource 2',
          url: 'https://example.com/2',
          type: 'video',
          difficulty: 'intermediate',
          duration: 60,
        },
      },
    ];

    it('should return all progress entries for a plan', async () => {
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.progressEntry.findMany as jest.Mock).mockResolvedValue(mockProgressEntries);

      const result = await progressService.getProgressByPlan('plan-1');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('in_progress');
      expect(prisma.progressEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { planId: 'plan-1' },
        })
      );
    });

    it('should throw error if plan not found', async () => {
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(progressService.getProgressByPlan('invalid-plan')).rejects.toThrow(
        'Learning plan not found'
      );
    });

    it('should return empty array if no progress entries exist', async () => {
      (prisma.learningPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.progressEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await progressService.getProgressByPlan('plan-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getProgressStats', () => {
    const mockPlans = [
      {
        id: 'plan-1',
        topicId: 'topic-1',
        title: 'Plan 1',
        preferences: '{}',
        phases: '[]',
        totalDuration: 10,
        completionPercentage: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
        progressEntries: [
          {
            id: 'progress-1',
            planId: 'plan-1',
            resourceId: 'resource-1',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
            notes: null,
            timeSpent: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'progress-2',
            planId: 'plan-1',
            resourceId: 'resource-2',
            status: 'in_progress',
            startedAt: new Date(),
            completedAt: null,
            notes: null,
            timeSpent: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      {
        id: 'plan-2',
        topicId: 'topic-2',
        title: 'Plan 2',
        preferences: '{}',
        phases: '[]',
        totalDuration: 15,
        completionPercentage: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        progressEntries: [
          {
            id: 'progress-3',
            planId: 'plan-2',
            resourceId: 'resource-3',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
            notes: null,
            timeSpent: 45,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'progress-4',
            planId: 'plan-2',
            resourceId: 'resource-4',
            status: 'not_started',
            startedAt: null,
            completedAt: null,
            notes: null,
            timeSpent: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    const mockRecentActivity = [
      {
        id: 'progress-1',
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        notes: null,
        timeSpent: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        resource: { title: 'Resource 1' },
      },
    ];

    it('should calculate overall statistics correctly', async () => {
      (prisma.learningPlan.findMany as jest.Mock).mockResolvedValueOnce(mockPlans);
      (prisma.progressEntry.findMany as jest.Mock).mockResolvedValue(mockRecentActivity);

      const stats = await progressService.getProgressStats();

      expect(stats.totalPlans).toBe(2);
      expect(stats.totalResources).toBe(4);
      expect(stats.completedResources).toBe(2);
      expect(stats.inProgressResources).toBe(1);
      expect(stats.notStartedResources).toBe(1);
      expect(stats.totalTimeSpent).toBe(90); // 30 + 15 + 45
      expect(stats.averageCompletionRate).toBe(62.5); // (75 + 50) / 2
    });

    it('should handle no plans gracefully', async () => {
      (prisma.learningPlan.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.progressEntry.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await progressService.getProgressStats();

      expect(stats.totalPlans).toBe(0);
      expect(stats.totalResources).toBe(0);
      expect(stats.completedResources).toBe(0);
      expect(stats.averageCompletionRate).toBe(0);
    });

    it('should include recent activity', async () => {
      (prisma.learningPlan.findMany as jest.Mock).mockResolvedValueOnce(mockPlans);
      (prisma.progressEntry.findMany as jest.Mock).mockResolvedValue(mockRecentActivity);

      const stats = await progressService.getProgressStats();

      expect(stats.recentActivity).toHaveLength(1);
      expect(stats.recentActivity[0]).toHaveProperty('resourceTitle');
      expect(stats.recentActivity[0]).toHaveProperty('status');
    });
  });
});
