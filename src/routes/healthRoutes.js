const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const config = require('../config/env');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check — used by load balancers & Kubernetes liveness probe
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness check — verifies DB connection, used by Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbOk = dbState === 1;

  const status = dbOk ? 200 : 503;
  return res.status(status).json({
    status: dbOk ? 'ready' : 'not_ready',
    checks: {
      database: dbOk ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/live
 * @desc    Liveness check — confirms the process is alive
 */
router.get('/live', (req, res) => res.status(200).json({ status: 'alive' }));

/**
 * @route   GET /health/info
 * @desc    Detailed system info (disable in production if sensitive)
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    app: config.app.name,
    version: process.env.npm_package_version || '1.0.0',
    environment: config.app.env,
    node: process.version,
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    os: {
      platform: os.platform(),
      cpus: os.cpus().length,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
    },
    database: {
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
