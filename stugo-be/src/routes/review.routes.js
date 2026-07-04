import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
    getTargetReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReviews
} from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/target/:targetId', getTargetReviews);

// Protected routes
router.use(authenticate);
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
