import express from 'express';
import {
    uploadDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
    reprocessDocument,
    upload
} from '../controllers/documentController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.post('/', restrictTo('admin'), upload.single('file'), uploadDocument);
router.put('/:id', restrictTo('admin'), updateDocument);
router.delete('/:id', restrictTo('admin'), deleteDocument);
router.post('/:id/reprocess', restrictTo('admin'), reprocessDocument);

// All authenticated users can view
router.get('/', getDocuments);
router.get('/:id', getDocument);

export default router;
