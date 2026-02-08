import request from 'supertest';
import express, { Application } from 'express';
import progressRoutes from '../progress';
import { progressService } from '../../services/progress.service';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the progress service
jest.mock('../../services/progress.service');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Progress Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/progress', progressRoutes);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/progress', () => {
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
        id: 'resource-1',
        title: 'Test Resource',
        url: 'https://example.com',
        type: 'article',
        difficulty: 'beginner',
        duration: 30,
      },
    };

    it('should create a progress entry successfully', async () => {
      (progressService.updateProgress as jest.Mock).mockResolvedValue(mockProgressEntry);

      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
          resourceId: 'resource-1',
          status: 'in_progress',
          notes: 'Test notes',
          timeSpent: 15,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Progress updated successfully');
      expect(response.body.data.id).toBe(mockProgressEntry.id);
      expect(response.body.data.status).toBe(mockProgressEntry.status);
      expect(response.body.data.notes).toBe(mockProgressEntry.notes);
      expect(progressService.updateProgress).toHaveBeenCalledWith({
        planId: 'plan-1',
        resourceId: 'resource-1',
        status: 'in_progress',
        notes: 'Test notes',
        timeSpent: 15,
      });
    });

    it('should handle progress entry without optional fields', async () => {
      (progressService.updateProgress as jest.Mock).mockResolvedValue({
        ...mockProgressEntry,
        notes: null,
        timeSpent: null,
      });

      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
          resourceId: 'resource-1',
          status: 'not_started',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
          resourceId: 'resource-1',
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject negative timeSpent', async () => {
      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
          resourceId: 'resource-1',
          status: 'in_progress',
          timeSpent: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject notes exceeding max length', async () => {
      const longNotes = 'a'.repeat(2001);

      const response = await request(app)
        .post('/api/progress')
        .send({
          planId: 'plan-1',
          resourceId: 'resource-1',
          status: 'in_progress',
          notes: longNotes,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/progress/stats', () => {
    const mockStats = {
      totalPlans: 3,
      totalResources: 12,
      completedResources: 5,
      inProgressResources: 4,
      notStartedResources: 3,
      totalTimeSpent: 240,
      averageCompletionRate: 55.5,
      recentActivity: [
        {
          id: 'progress-1',
          planId: 'plan-1',
          resourceTitle: 'Test Resource',
          status: 'completed',
          updatedAt: new Date(),
        },
      ],
    };

    it('should return progress statistics', async () => {
      (progressService.getProgressStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app).get('/api/progress/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPlans).toBe(mockStats.totalPlans);
      expect(response.body.data.completedResources).toBe(mockStats.completedResources);
      expect(response.body.data.recentActivity).toHaveLength(1);
      expect(progressService.getProgressStats).toHaveBeenCalled();
    });

    it('should handle empty statistics', async () => {
      const emptyStats = {
        totalPlans: 0,
        totalResources: 0,
        completedResources: 0,
        inProgressResources: 0,
        notStartedResources: 0,
        totalTimeSpent: 0,
        averageCompletionRate: 0,
        recentActivity: [],
      };

      (progressService.getProgressStats as jest.Mock).mockResolvedValue(emptyStats);

      const response = await request(app).get('/api/progress/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.totalPlans).toBe(0);
    });
  });

  describe('GET /api/progress/:planId', () => {
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

    it('should return progress entries for a plan', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue(mockProgressEntries);

      const response = await request(app).get('/api/progress/plan-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.planId).toBe('plan-1');
      expect(response.body.data.progressEntries).toHaveLength(2);
      expect(response.body.data.summary).toEqual({
        totalResources: 2,
        completedCount: 1,
        inProgressCount: 1,
        notStartedCount: 0,
        totalTimeSpent: 45,
        completionPercentage: 50,
      });
    });

    it('should return empty array for plan with no progress', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/progress/plan-1');

      expect(response.status).toBe(200);
      expect(response.body.data.progressEntries).toHaveLength(0);
      expect(response.body.data.summary.totalResources).toBe(0);
    });

    it('should handle plan not found error', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockRejectedValue(
        new Error('Learning plan not found')
      );

      const response = await request(app).get('/api/progress/invalid-plan');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/progress/:planId/:resourceId', () => {
    const existingEntry = {
      id: 'progress-1',
      planId: 'plan-1',
      resourceId: 'resource-1',
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      notes: 'Old notes',
      timeSpent: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      resource: {
        id: 'resource-1',
        title: 'Test Resource',
        url: 'https://example.com',
        type: 'article',
        difficulty: 'beginner',
        duration: 30,
      },
    };

    it('should update progress entry status', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue([existingEntry]);
      (progressService.updateProgress as jest.Mock).mockResolvedValue({
        ...existingEntry,
        status: 'completed',
        completedAt: new Date(),
      });

      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should update progress entry notes', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue([existingEntry]);
      (progressService.updateProgress as jest.Mock).mockResolvedValue({
        ...existingEntry,
        notes: 'Updated notes',
      });

      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({
          notes: 'Updated notes',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should update progress entry timeSpent', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue([existingEntry]);
      (progressService.updateProgress as jest.Mock).mockResolvedValue({
        ...existingEntry,
        timeSpent: 45,
      });

      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({
          timeSpent: 45,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.timeSpent).toBe(45);
    });

    it('should reject update with no fields provided', async () => {
      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('At least one field must be provided');
    });

    it('should handle progress entry not found', async () => {
      (progressService.getProgressByPlan as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({
          status: 'completed',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Progress entry not found');
    });

    it('should reject invalid status in update', async () => {
      const response = await request(app)
        .patch('/api/progress/plan-1/resource-1')
        .send({
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
