const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Mongoose validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Validation failed',
    errors,
  };
};

// Mongoose duplicate key error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: StatusCodes.CONFLICT,
    message: `A record with this ${field} already exists`,
  };
};

// Mongoose CastError (invalid ObjectId)
const handleCastError = () => ({
  statusCode: StatusCodes.BAD_REQUEST,
  message: 'Invalid ID format',
});

// JWT errors
const handleJWTError = () => ({
  statusCode: StatusCodes.UNAUTHORIZED,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: StatusCodes.UNAUTHORIZED,
  message: 'Token expired. Please log in again.',
});

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  let { errors } = err;

  statusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  message = message || 'Internal server error';

  // Mongoose errors
  if (err.name === 'ValidationError') {
    ({ statusCode, message, errors } = handleValidationError(err));
  } else if (err.code === 11000) {
    ({ statusCode, message } = handleDuplicateKeyError(err));
  } else if (err.name === 'CastError') {
    ({ statusCode, message } = handleCastError());
  } else if (err.name === 'JsonWebTokenError') {
    ({ statusCode, message } = handleJWTError());
  } else if (err.name === 'TokenExpiredError') {
    ({ statusCode, message } = handleJWTExpiredError());
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error:', {
      message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) response.errors = errors;

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

// 404 handler (use before errorHandler)
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND);
  next(err);
};

module.exports = { errorHandler, notFoundHandler, AppError };
