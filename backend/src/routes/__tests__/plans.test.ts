import request from 'supertest';
import express, { Application } from 'express';
import plansRoutes from '../plans';
import { planGeneratorService } from '../../services/plan-generator.service';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the plan generator service
jest.mock('../../services/plan-generator.service');

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Plans Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/plans', plansRoutes);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/plans/generate', () => {
    const mockPlan = {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'Learning Plan for React Hooks',
      preferences: {
        freeOnly: true,
        pace: 'moderate' as const,
      },
      phases: [
        {
          name: 'Foundation',
          description: 'Learn the basics',
          order: 1,
          estimatedHours: 10,
          resources: [
            {
              resourceId: 'resource-1',
              title: 'React Basics',
              url: 'https://example.com/react',
              type: 'article',
              difficulty: 'beginner',
              duration: 30,
              reason: 'Good introduction',
            },
          ],
        },
      ],
      totalDuration: 10,
      completionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate a plan successfully', async () => {
      (planGeneratorService.generatePlan as jest.Mock).mockResolvedValue(mockPlan);

      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'topic-1',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Learning plan generated successfully');
      expect(response.body.data.id).toBe('plan-1');
      expect(response.body.data.topicId).toBe('topic-1');
      expect(planGeneratorService.generatePlan).toHaveBeenCalledWith('topic-1', undefined);
    });

    it('should generate a plan with preferences', async () => {
      (planGeneratorService.generatePlan as jest.Mock).mockResolvedValue(mockPlan);

      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'topic-1',
        preferences: {
          freeOnly: true,
          pace: 'intensive',
          preferredTypes: ['video', 'course'],
          maxDuration: 20,
        },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(planGeneratorService.generatePlan).toHaveBeenCalledWith('topic-1', {
        freeOnly: true,
        pace: 'intensive',
        preferredTypes: ['video', 'course'],
        maxDuration: 20,
      });
    });

    it('should reject missing topicId', async () => {
      const response = await request(app).post('/api/plans/generate').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request data');
    });

    it('should reject empty topicId', async () => {
      const response = await request(app).post('/api/plans/generate').send({
        topicId: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid pace', async () => {
      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'topic-1',
        preferences: {
          pace: 'super-fast',
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid maxDuration', async () => {
      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'topic-1',
        preferences: {
          maxDuration: 0,
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle topic not found error', async () => {
      (planGeneratorService.generatePlan as jest.Mock).mockRejectedValue(
        new Error('Topic not found')
      );

      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'nonexistent',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle no resources available error', async () => {
      (planGeneratorService.generatePlan as jest.Mock).mockRejectedValue(
        new Error('No resources available for this topic')
      );

      const response = await request(app).post('/api/plans/generate').send({
        topicId: 'topic-1',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/plans/:id', () => {
    const mockPlan = {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'Learning Plan for React Hooks',
      preferences: {},
      phases: [],
      totalDuration: 10,
      completionPercentage: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return plan details', async () => {
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(mockPlan);

      const response = await request(app).get('/api/plans/plan-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('plan-1');
      expect(response.body.data.completionPercentage).toBe(25);
      expect(planGeneratorService.getPlan).toHaveBeenCalledWith('plan-1');
    });

    it('should return 404 when plan not found', async () => {
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/plans/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Learning plan not found');
    });

    it('should handle service errors', async () => {
      (planGeneratorService.getPlan as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/plans/plan-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/plans', () => {
    const mockPlans = [
      {
        id: 'plan-1',
        topicId: 'topic-1',
        title: 'Learning Plan for React',
        totalDuration: 10,
        completionPercentage: 25,
        createdAt: new Date('2024-02-01'),
      },
      {
        id: 'plan-2',
        topicId: 'topic-2',
        title: 'Learning Plan for TypeScript',
        totalDuration: 15,
        completionPercentage: 50,
        createdAt: new Date('2024-02-02'),
      },
    ];

    it('should list all plans', async () => {
      (planGeneratorService.listPlans as jest.Mock).mockResolvedValue(mockPlans);

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plans).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
      expect(planGeneratorService.listPlans).toHaveBeenCalled();
    });

    it('should return empty array when no plans exist', async () => {
      (planGeneratorService.listPlans as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(200);
      expect(response.body.data.plans).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });

    it('should handle service errors', async () => {
      (planGeneratorService.listPlans as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/plans/:id', () => {
    it('should delete a plan successfully', async () => {
      (planGeneratorService.deletePlan as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/plans/plan-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Learning plan deleted successfully');
      expect(planGeneratorService.deletePlan).toHaveBeenCalledWith('plan-1');
    });

    it('should handle plan not found error', async () => {
      (planGeneratorService.deletePlan as jest.Mock).mockRejectedValue(
        new Error('Learning plan not found')
      );

      const response = await request(app).delete('/api/plans/nonexistent');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      (planGeneratorService.deletePlan as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/plans/plan-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/plans/:id/export', () => {
    const mockPlan = {
      id: 'plan-1',
      topicId: 'topic-1',
      title: 'Learning Plan for React Hooks',
      preferences: {},
      phases: [],
      totalDuration: 10,
      completionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should export plan as markdown by default', async () => {
      const mockMarkdown = '# Learning Plan\n\nContent here';
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(mockPlan);
      (planGeneratorService.exportAsMarkdown as jest.Mock).mockReturnValue(mockMarkdown);

      const response = await request(app).get('/api/plans/plan-1/export');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="learning-plan-plan-1.md"'
      );
      expect(response.text).toBe(mockMarkdown);
      expect(planGeneratorService.getPlan).toHaveBeenCalledWith('plan-1');
      expect(planGeneratorService.exportAsMarkdown).toHaveBeenCalledWith(mockPlan);
    });

    it('should export plan as markdown when explicitly requested', async () => {
      const mockMarkdown = '# Learning Plan\n\nContent here';
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(mockPlan);
      (planGeneratorService.exportAsMarkdown as jest.Mock).mockReturnValue(mockMarkdown);

      const response = await request(app).get('/api/plans/plan-1/export?format=markdown');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/markdown; charset=utf-8');
      expect(planGeneratorService.exportAsMarkdown).toHaveBeenCalledWith(mockPlan);
    });

    it('should export plan as PDF', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(mockPlan);
      (planGeneratorService.exportAsPdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

      const response = await request(app).get('/api/plans/plan-1/export?format=pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toBe(
        'attachment; filename="learning-plan-plan-1.pdf"'
      );
      expect(planGeneratorService.getPlan).toHaveBeenCalledWith('plan-1');
      expect(planGeneratorService.exportAsPdf).toHaveBeenCalledWith(mockPlan);
    });

    it('should return 404 when plan not found', async () => {
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/plans/nonexistent/export');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Learning plan not found');
    });

    it('should reject invalid format', async () => {
      const response = await request(app).get('/api/plans/plan-1/export?format=json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle export service errors', async () => {
      (planGeneratorService.getPlan as jest.Mock).mockResolvedValue(mockPlan);
      (planGeneratorService.exportAsMarkdown as jest.Mock).mockImplementation(() => {
        throw new Error('Export failed');
      });

      const response = await request(app).get('/api/plans/plan-1/export');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
