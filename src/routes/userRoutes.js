const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

const mongoIdValidator = param('id').isMongoId().withMessage('Invalid user ID');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 */
router.get('/profile', userController.getProfile);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 */
router.get('/', authorize('admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only)
 */
router.get('/:id', [mongoIdValidator], validate, authorize('admin'), userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (own profile or admin)
 */
router.put(
  '/:id',
  [
    mongoIdValidator,
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']),
  ],
  validate,
  userController.updateUser,
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate a user (admin only)
 */
router.delete('/:id', [mongoIdValidator], validate, authorize('admin'), userController.deactivateUser);

module.exports = router;
