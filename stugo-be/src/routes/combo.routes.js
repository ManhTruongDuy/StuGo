import express from 'express';
import * as comboController from '../controllers/combo.controller.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = express.Router();

// Public routes
router.get('/', comboController.getCombos);
router.get('/:id', comboController.getComboById);

// Protected routes (Partners and Admins)
router.post('/', authenticate, authorize('partner', 'admin'), comboController.createCombo);
router.put('/:id', authenticate, authorize('partner', 'admin'), comboController.updateCombo);
router.delete('/:id', authenticate, authorize('partner', 'admin'), comboController.deleteCombo);

export default router;
