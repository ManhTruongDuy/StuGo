import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { chatWithAI } from '../controllers/chatbot.controller.js';

const router = express.Router();

// Route: POST /api/chatbot
// Description: Ask AI a question, exclusively for premium students
router.post('/', authenticate, chatWithAI);

export default router;
