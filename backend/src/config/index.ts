import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  apiKeys: {
    claude: process.env.CLAUDE_API_KEY || '',
    youtube: process.env.YOUTUBE_API_KEY || '',
    github: process.env.GITHUB_TOKEN || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
