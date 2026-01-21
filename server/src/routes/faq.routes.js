import express from 'express';
import {
    createFAQ,
    getFAQs,
    getFAQ,
    updateFAQ,
    deleteFAQ,
    markHelpful
} from '../controllers/faqController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getFAQs);
router.get('/:id', optionalAuth, getFAQ);
router.post('/:id/helpful', optionalAuth, markHelpful);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createFAQ);
router.put('/:id', protect, restrictTo('admin'), updateFAQ);
router.delete('/:id', protect, restrictTo('admin'), deleteFAQ);

export default router;
