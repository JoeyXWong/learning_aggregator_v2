import request from 'supertest';
import express, { Application } from 'express';
import healthRoutes from '../health';
import { prisma } from '../../utils/db';
import { errorHandler } from '../../middleware/errorHandler';

// Mock prisma
jest.mock('../../utils/db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
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

describe('Health Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api', healthRoutes);
    app.use(errorHandler);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }]);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return 500 when database connection fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('unexpected error');
    });
  });

  describe('GET /api/health/db', () => {
    it('should return database connection status with response time', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '1': 1 }]);

      const response = await request(app).get('/api/health/db');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.database).toBe('connected');
      expect(response.body.responseTime).toMatch(/^\d+ms$/);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return 500 when database query fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const response = await request(app).get('/api/health/db');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
