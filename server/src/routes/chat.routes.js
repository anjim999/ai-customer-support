import express from 'express';
import {
    createConversation,
    getConversations,
    getConversation,
    sendMessage,
    streamMessage,
    deleteConversation,
    clearMessages
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { chatLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Conversation routes
router.post('/conversations', createConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.delete('/conversations/:id/messages', clearMessages);

// Message routes
router.post('/conversations/:id/messages', chatLimiter, sendMessage);
router.post('/conversations/:id/stream', chatLimiter, streamMessage);

export default router;
