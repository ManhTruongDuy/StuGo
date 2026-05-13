import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
    getServiceReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReviews
} from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/service/:serviceId', getServiceReviews);

// Protected routes
router.use(authenticate);
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
