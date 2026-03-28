const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = StatusCodes.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, StatusCodes.CREATED);
  }

  static error(res, message = 'An error occurred', statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, StatusCodes.NOT_FOUND);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, StatusCodes.BAD_REQUEST, errors);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, StatusCodes.FORBIDDEN);
  }

  static paginated(res, data, pagination) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Success',
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
