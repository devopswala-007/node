const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const config = require('../config/env');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401);
    }

    req.user = user;
    logger.info(`Authenticated: ${user.email} [${req.method} ${req.originalUrl}]`);
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  return next();
};

module.exports = { authenticate, authorize };
