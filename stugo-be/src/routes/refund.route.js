import express from 'express';
import { getRefundRequests, reviewRefundRequest } from '../controllers/refund.controller.js';
import { auth, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin only routes
router.use(auth, authorize('admin'));

router.get('/', getRefundRequests);
router.post('/:id/review', reviewRefundRequest);

export default router;
