const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    return ApiResponse.created(res, { user, token }, 'Registration successful');
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    return ApiResponse.success(res, { user, token }, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) => ApiResponse.success(res, { user: req.user }, 'Profile fetched');

module.exports = { register, login, getMe };
