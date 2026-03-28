const { AppError, errorHandler } = require('../../src/middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = {
  originalUrl: '/api/test',
  method: 'GET',
  ip: '127.0.0.1',
};

describe('AppError', () => {
  it('creates an error with statusCode and isOperational flag', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe('errorHandler middleware', () => {
  let res;
  const next = jest.fn();

  beforeEach(() => {
    res = mockRes();
    process.env.NODE_ENV = 'test';
  });

  it('handles AppError with correct status', () => {
    const err = new AppError('Resource not found', 404);
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Resource not found');
  });

  it('handles Mongoose CastError as 400', () => {
    const err = new Error('Cast error');
    err.name = 'CastError';
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles Mongoose duplicate key error as 409', () => {
    const err = new Error('Duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'test@test.com' };
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('handles JWT error as 401', () => {
    const err = new Error('JWT');
    err.name = 'JsonWebTokenError';
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('handles expired JWT as 401', () => {
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('defaults to 500 for unknown errors', () => {
    const err = new Error('Unknown');
    errorHandler(err, mockReq, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
