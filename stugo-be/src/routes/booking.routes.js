import express from 'express';
import { bookingController } from '../controllers/index.js';
import { authenticate, createBookingRules, mongoIdParam } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings (or all for admin/partner)
 * @access  Private
 */
router.get('/', authenticate, bookingController.getBookings);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Private
 */
router.get('/stats', authenticate, bookingController.getBookingStats);

/**
 * @route   GET /api/bookings/slots/:serviceId
 * @desc    Get available slots for a service
 * @access  Public
 */
router.get('/slots/:serviceId', mongoIdParam('serviceId'), bookingController.getAvailableSlots);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdParam('id'), bookingController.getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', authenticate, createBookingRules, bookingController.createBooking);

/**
 * @route   PATCH /api/bookings/:id/confirm
 * @desc    Confirm booking (by service owner)
 * @access  Private (Owner/Admin)
 */
router.patch('/:id/confirm', authenticate, mongoIdParam('id'), bookingController.confirmBooking);

/**
 * @route   PATCH /api/bookings/:id/complete
 * @desc    Complete booking
 * @access  Private (Owner/Admin)
 */
router.patch('/:id/complete', authenticate, mongoIdParam('id'), bookingController.completeBooking);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.post('/:id/cancel', authenticate, mongoIdParam('id'), bookingController.cancelBooking);

export default router;
