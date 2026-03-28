const ApiResponse = require('../../src/utils/apiResponse');

// Mock Express res object
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ApiResponse', () => {
  let res;

  beforeEach(() => {
    res = mockRes();
  });

  describe('success()', () => {
    it('returns 200 with success: true', () => {
      ApiResponse.success(res, { id: 1 }, 'Done');
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.message).toBe('Done');
      expect(body.data).toEqual({ id: 1 });
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('created()', () => {
    it('returns 201 with success: true', () => {
      ApiResponse.created(res, { id: 2 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json.mock.calls[0][0].success).toBe(true);
    });
  });

  describe('error()', () => {
    it('returns the given status code with success: false', () => {
      ApiResponse.error(res, 'Something broke', 500);
      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe('Something broke');
    });

    it('includes errors array when provided', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];
      ApiResponse.error(res, 'Validation failed', 400, errors);
      expect(res.json.mock.calls[0][0].errors).toEqual(errors);
    });
  });

  describe('notFound()', () => {
    it('returns 404', () => {
      ApiResponse.notFound(res, 'Not here');
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('badRequest()', () => {
    it('returns 400', () => {
      ApiResponse.badRequest(res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('unauthorized()', () => {
    it('returns 401', () => {
      ApiResponse.unauthorized(res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('paginated()', () => {
    it('returns 200 with pagination object', () => {
      const pagination = { page: 1, limit: 10, total: 50, totalPages: 5 };
      ApiResponse.paginated(res, [], pagination);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.pagination).toEqual(pagination);
      expect(body.success).toBe(true);
    });
  });
});
