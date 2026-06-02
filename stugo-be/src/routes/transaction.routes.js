import express from 'express';
import transactionController from '../controllers/transaction.controller.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();

// Partner routes
router.get('/balance', authenticate, transactionController.getBalance);
router.get('/', authenticate, transactionController.getTransactions);
router.post('/withdraw', authenticate, authorize('partner', 'admin'), transactionController.requestWithdrawal);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), transactionController.getAllTransactions);
router.patch('/:id/status', authenticate, authorize('admin'), transactionController.updateTransactionStatus);

export default router;
