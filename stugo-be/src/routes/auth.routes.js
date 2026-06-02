import express from 'express';
import passport from 'passport';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 */
router.post('/login', authController.loginWithEmail);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
  authController.googleCallback
);

/**
 * @route   GET /api/auth/me
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/refresh
 */
router.post('/refresh', authenticate, authController.refreshToken);

export default router;
