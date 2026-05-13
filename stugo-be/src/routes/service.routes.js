import express from 'express';
import { serviceController } from '../controllers/index.js';
import { authenticate, optionalAuth, partnerOrAdmin, adminOnly, createServiceRules, mongoIdParam } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all services with filters
 * @access  Public
 */
router.get('/', optionalAuth, serviceController.getServices);

/**
 * @route   GET /api/services/popular
 * @desc    Get popular services
 * @access  Public
 */
router.get('/popular', serviceController.getPopularServices);

/**
 * @route   GET /api/services/nearby
 * @desc    Get nearby services by location
 * @access  Public
 */
router.get('/nearby', serviceController.getNearbyServices);

/**
 * @route   GET /api/services/my
 * @desc    Get owner's services
 * @access  Private (Partner/Admin)
 */
router.get('/my', authenticate, partnerOrAdmin, serviceController.getMyServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id', mongoIdParam('id'), optionalAuth, serviceController.getServiceById);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Partner/Admin)
 */
router.post('/', authenticate, partnerOrAdmin, createServiceRules, serviceController.createService);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Owner/Admin)
 */
router.put('/:id', authenticate, mongoIdParam('id'), serviceController.updateService);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', authenticate, mongoIdParam('id'), serviceController.deleteService);

/**
 * @route   PATCH /api/services/:id/status
 * @desc    Update service status (approve/reject)
 * @access  Private (Admin)
 */
router.patch('/:id/status', authenticate, adminOnly, mongoIdParam('id'), serviceController.updateServiceStatus);

export default router;
