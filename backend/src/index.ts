import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/db';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import topicsRoutes from './routes/topics';
import resourcesRoutes from './routes/resources';
import plansRoutes from './routes/plans';
import progressRoutes from './routes/progress';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// General rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for expensive operations (external API calls)
const expensiveLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 10,
  message: 'Rate limit exceeded for resource-intensive operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: '100kb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api/resources', resourcesRoutes);

// Apply stricter rate limits to expensive write endpoints before mounting routes
app.post('/api/topics', expensiveLimiter);
app.use('/api/topics', topicsRoutes);

app.post('/api/plans/generate', expensiveLimiter);
app.use('/api/plans', plansRoutes);
app.use('/api/progress', progressRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Learning Aggregator API',
    version: '0.1.0',
    status: 'running',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Frontend URL: ${config.frontendUrl}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  await prisma.$disconnect();
  logger.info('Database disconnected');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
