import express from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register with email/password
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/password
 * @access  Public
 */
router.post('/login', authController.loginWithEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticate, authController.refreshToken);

export default router;
