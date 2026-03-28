require('dotenv').config();

const config = {
  app: {
    name: process.env.APP_NAME || 'TaskFlow API',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  db: {
    uri: process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_URI_TEST
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-not-for-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

// Validate critical config at startup
if (config.app.isProd && config.jwt.secret === 'fallback-secret-not-for-production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

module.exports = config;
