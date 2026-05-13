import express from 'express';
import { paymentController } from '../controllers/index.js';
import { authenticate, optionalAuth, adminOnly, mongoIdParam, createPaymentRules } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/payments
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/', authenticate, paymentController.getPaymentHistory);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, adminOnly, paymentController.getPaymentStats);

/**
 * @route   POST /api/payments
 * @desc    Create payment link for booking (PayOS) - Legacy endpoint
 * @access  Private
 */
router.post('/', authenticate, createPaymentRules, paymentController.createPayment);

/**
 * @route   POST /api/payments/accommodation
 * @desc    Create payment link for accommodation booking
 * @access  Private
 */
router.post('/accommodation', authenticate, createPaymentRules, paymentController.createAccommodationPayment);

/**
 * @route   POST /api/payments/restaurant
 * @desc    Create payment link for restaurant booking
 * @access  Private
 */
router.post('/restaurant', authenticate, createPaymentRules, paymentController.createRestaurantPayment);

/**
 * @route   POST /api/payments/transport
 * @desc    Create payment link for transport booking
 * @access  Private
 */
router.post('/transport', authenticate, createPaymentRules, paymentController.createTransportPayment);

/**
 * @route   POST /api/payments/remaining
 * @desc    Create payment link for remaining amount
 * @access  Private
 */
router.post('/remaining', authenticate, createPaymentRules, paymentController.createRemainingPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    PayOS webhook handler
 * @access  Public (verified by PayOS signature)
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @route   GET /api/payments/:orderCode/status
 * @desc    Check payment status from PayOS
 * @access  Private
 */
router.get('/:orderCode/status', authenticate, paymentController.checkPaymentStatus);

/**
 * @route   POST /api/payments/:orderCode/cancel
 * @desc    Cancel payment
 * @access  Private
 */
router.post('/:orderCode/cancel', authenticate, paymentController.cancelPayment);

/**
 * @route   GET /api/payments/:orderCode
 * @desc    Get payment by order code
 * @access  Optional Auth (allows viewing payment success/cancel pages without login)
 * @note    Must be last to avoid matching /accommodation, /restaurant, /transport
 */
router.get('/:orderCode', optionalAuth, paymentController.getPaymentByOrderCode);

export default router;
