const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await userService.getAllUsers(req.query);
    return ApiResponse.paginated(res, users, pagination);
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return ApiResponse.success(res, user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user._id,
      req.user.role,
    );
    return ApiResponse.success(res, user, 'User updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    await userService.deactivateUser(req.params.id);
    return ApiResponse.success(res, null, 'User deactivated successfully');
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    return ApiResponse.success(res, user, 'Profile fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, getProfile };
