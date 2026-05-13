import express from 'express';
import { dashboardController } from '../controllers/index.js';
import { authenticate, partnerOrAdmin } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview statistics
 * @access  Private (Partner/Admin)
 */
router.get('/overview', authenticate, partnerOrAdmin, dashboardController.getDashboardOverview);

/**
 * @route   GET /api/dashboard/revenue
 * @desc    Get revenue statistics by date range
 * @access  Private (Partner/Admin)
 */
router.get('/revenue', authenticate, partnerOrAdmin, dashboardController.getRevenueStats);

/**
 * @route   GET /api/dashboard/bookings-by-type
 * @desc    Get booking statistics by service type
 * @access  Private (Partner/Admin)
 */
router.get('/bookings-by-type', authenticate, partnerOrAdmin, dashboardController.getBookingsByType);

/**
 * @route   GET /api/dashboard/recent-bookings
 * @desc    Get recent bookings
 * @access  Private (Partner/Admin)
 */
router.get('/recent-bookings', authenticate, partnerOrAdmin, dashboardController.getRecentBookings);

/**
 * @route   GET /api/dashboard/top-services
 * @desc    Get top services by revenue
 * @access  Private (Partner/Admin)
 */
router.get('/top-services', authenticate, partnerOrAdmin, dashboardController.getTopServices);

export default router;
