const express = require('express');
const { body, param, query } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

const taskBodyValidators = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),
  body('priority').optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO8601 date'),
  body('tags').optional()
    .isArray().withMessage('Tags must be an array'),
];

const mongoIdValidator = param('id').isMongoId().withMessage('Invalid task ID');

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics for current user
 */
router.get('/stats', taskController.getTaskStats);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (paginated, filtered, sorted)
 * @query   page, limit, status, priority, search, sort, order
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
    query('status').optional().isIn(['todo', 'in-progress', 'done']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  taskController.getAllTasks,
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 */
router.get('/:id', [mongoIdValidator], validate, taskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 */
router.post('/', taskBodyValidators, validate, taskController.createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 */
router.put(
  '/:id',
  [mongoIdValidator, ...taskBodyValidators.map((v) => v.optional())],
  validate,
  taskController.updateTask,
);

/**
 * @route   PATCH /api/tasks/:id
 * @desc    Partially update a task (e.g., status only)
 */
router.patch(
  '/:id',
  [
    mongoIdValidator,
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  taskController.updateTask,
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 */
router.delete('/:id', [mongoIdValidator], validate, taskController.deleteTask);

module.exports = router;
