const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config/env');
const logger = require('../utils/logger');

const generateToken = (userId) => jwt.sign(
  { id: userId },
  config.jwt.secret,
  { expiresIn: config.jwt.expiresIn },
);

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  logger.info(`New user registered: ${email}`);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user._id);
  logger.info(`User logged in: ${email}`);

  // Return user without password
  const userObj = user.toJSON();
  return { user: userObj, token };
};

module.exports = { register, login };
