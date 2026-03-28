const Task = require('../models/Task');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const buildFilter = (query, userId) => {
  const filter = { createdBy: userId };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
};

const getAllTasks = async (query, userId) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;

  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;

  const filter = buildFilter(query, userId);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, createdBy: userId })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!task) throw new AppError('Task not found', 404);
  return task;
};

const createTask = async (taskData, userId) => {
  const task = await Task.create({ ...taskData, createdBy: userId });
  logger.info(`Task created: ${task.title} by user ${userId}`);
  return task;
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, createdBy: userId },
    updateData,
    { new: true, runValidators: true },
  ).populate('assignedTo', 'name email');

  if (!task) throw new AppError('Task not found', 404);
  logger.info(`Task updated: ${taskId}`);
  return task;
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, createdBy: userId });
  if (!task) throw new AppError('Task not found', 404);
  logger.info(`Task deleted: ${taskId}`);
  return task;
};

const getTaskStats = async (userId) => {
  const stats = await Task.aggregate([
    { $match: { createdBy: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
  stats.forEach(({ _id, count }) => {
    result[_id] = count;
    result.total += count;
  });

  return result;
};

module.exports = {
  getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTaskStats,
};
