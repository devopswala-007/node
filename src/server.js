const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const config = require('./config/env');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  server = app.listen(config.app.port, () => {
    logger.info(`🚀 ${config.app.name} started`);
    logger.info(`   Environment : ${config.app.env}`);
    logger.info(`   Port        : ${config.app.port}`);
    logger.info(`   Health      : http://localhost:${config.app.port}/health`);
  });

  // Handle server-level errors (e.g., EADDRINUSE)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${config.app.port} is already in use`);
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });
};

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force kill after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions (last resort — should not happen in production)
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
