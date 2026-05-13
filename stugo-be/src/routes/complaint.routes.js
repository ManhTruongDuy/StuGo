import express from 'express';
import { complaintController } from '../controllers/index.js';
import { authenticate, adminOnly, createComplaintRules, mongoIdParam } from '../middlewares/index.js';

const router = express.Router();

/**
 * @route   GET /api/complaints
 * @desc    Get complaints
 * @access  Private
 */
router.get('/', authenticate, complaintController.getComplaints);

/**
 * @route   GET /api/complaints/stats
 * @desc    Get complaint statistics
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, adminOnly, complaintController.getComplaintStats);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private
 */
router.get('/:id', authenticate, mongoIdParam('id'), complaintController.getComplaintById);

/**
 * @route   POST /api/complaints
 * @desc    Create complaint
 * @access  Private
 */
router.post('/', authenticate, createComplaintRules, complaintController.createComplaint);

/**
 * @route   POST /api/complaints/:id/respond
 * @desc    Respond to complaint
 * @access  Private (Admin)
 */
router.post('/:id/respond', authenticate, adminOnly, mongoIdParam('id'), complaintController.respondToComplaint);

/**
 * @route   POST /api/complaints/:id/resolve
 * @desc    Resolve complaint
 * @access  Private (Admin)
 */
router.post('/:id/resolve', authenticate, adminOnly, mongoIdParam('id'), complaintController.resolveComplaint);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Admin)
 */
router.patch('/:id/status', authenticate, adminOnly, mongoIdParam('id'), complaintController.updateComplaintStatus);

export default router;
