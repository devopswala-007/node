const taskService = require('../services/taskService');
const ApiResponse = require('../utils/apiResponse');

const getAllTasks = async (req, res, next) => {
  try {
    const { tasks, pagination } = await taskService.getAllTasks(req.query, req.user._id);
    return ApiResponse.paginated(res, tasks, pagination);
  } catch (error) {
    return next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id);
    return ApiResponse.success(res, task);
  } catch (error) {
    return next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    return ApiResponse.created(res, task, 'Task created successfully');
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user._id);
    return ApiResponse.success(res, task, 'Task updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user._id);
    return ApiResponse.success(res, null, 'Task deleted successfully');
  } catch (error) {
    return next(error);
  }
};

const getTaskStats = async (req, res, next) => {
  try {
    const stats = await taskService.getTaskStats(req.user._id);
    return ApiResponse.success(res, stats, 'Task statistics fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTaskStats };
