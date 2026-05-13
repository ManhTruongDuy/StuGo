import express from 'express';
import { getPlans, createSubscription, getMySubscription, cancelSubscription, checkAndExpireSubscriptions, createSubscriptionPayment, activateSubscriptionAfterPayment } from '../controllers/subscription.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes (require login)
router.use(authenticate);
router.post('/', createSubscription);
router.get('/my', getMySubscription);
router.patch('/my/cancel', cancelSubscription);
router.post('/payment', createSubscriptionPayment);
router.post('/activate', activateSubscriptionAfterPayment);

// Admin-only: manually trigger expiry check
router.get('/expire-check', checkAndExpireSubscriptions);

export default router;
