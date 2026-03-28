const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const getAllUsers = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.role) filter.role = query.role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page, limit, total, totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateUser = async (userId, updateData, requestingUserId, requestingRole) => {
  // Users can only update themselves unless admin
  if (userId !== requestingUserId.toString() && requestingRole !== 'admin') {
    throw new AppError('You can only update your own profile', 403);
  }

  // Prevent non-admins from changing roles
  if (updateData.role && requestingRole !== 'admin') {
    throw new AppError('Only admins can change user roles', 403);
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true, runValidators: true,
  });

  if (!user) throw new AppError('User not found', 404);
  logger.info(`User updated: ${userId}`);
  return user;
};

const deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );
  if (!user) throw new AppError('User not found', 404);
  logger.info(`User deactivated: ${userId}`);
  return user;
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = {
  getAllUsers, getUserById, updateUser, deactivateUser, getProfile,
};
