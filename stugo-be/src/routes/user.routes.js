import express from 'express';
import { userController } from '../controllers/index.js';
import { authenticate, adminOnly, updateUserRules, mongoIdParam } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/', authenticate, adminOnly, userController.getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user overview stats
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, adminOnly, userController.getUserOverviewStats);

/**
 * @route   GET /api/users/partners
 * @desc    Get partners list
 * @access  Private (Admin)
 */
router.get('/partners', authenticate, adminOnly, userController.getPartners);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdParam('id'), userController.getUserById);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, mongoIdParam('id'), userController.getUserStats);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', authenticate, mongoIdParam('id'), updateUserRules, userController.updateUser);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (ban/activate)
 * @access  Private (Admin)
 */
router.patch('/:id/status', authenticate, adminOnly, mongoIdParam('id'), userController.updateUserStatus);

export default router;
