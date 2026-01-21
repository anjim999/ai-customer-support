import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { Document } from '../models/index.js';
import ragService from '../services/ragService.js';

// Configure multer storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// @desc    Upload document
// @route   POST /api/documents
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { title, description } = req.body;

        // Create document record
        const document = await Document.create({
            title: title || req.file.originalname,
            description: description || '',
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            uploadedBy: req.user.userId,
            status: 'pending'
        });

        // Process document asynchronously
        ragService.processDocument(document._id)
            .then(() => {
                console.log(`✅ Document ${document._id} processed successfully`);
            })
            .catch((error) => {
                console.error(`❌ Document ${document._id} processing failed:`, error);
            });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully. Processing in progress.',
            document: {
                id: document._id,
                title: document.title,
                status: document.status
            }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload document'
        });
    }
};

// @desc    Get all documents
// @route   GET /api/documents
export const getDocuments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const documents = await Document.find(query)
            .select('-rawContent -chunks')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Document.countDocuments(query);

        res.status(200).json({
            success: true,
            documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents'
        });
    }
};

// @desc    Get single document
// @route   GET /api/documents/:id
export const getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .select('-rawContent')
            .populate('uploadedBy', 'name email');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document'
        });
    }
};

// @desc    Update document
// @route   PUT /api/documents/:id
export const updateDocument = async (req, res) => {
    try {
        const { title, description, isActive } = req.body;

        const document = await Document.findByIdAndUpdate(
            req.params.id,
            { title, description, isActive },
            { new: true, runValidators: true }
        ).select('-rawContent -chunks');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update document'
        });
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete file from disk
        try {
            await fs.unlink(document.filePath);
        } catch (fileError) {
            console.error('Failed to delete file:', fileError);
        }

        // Delete document record
        await document.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document'
        });
    }
};

// @desc    Reprocess document
// @route   POST /api/documents/:id/reprocess
export const reprocessDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Trigger reprocessing
        ragService.processDocument(document._id)
            .then(() => {
                console.log(`✅ Document ${document._id} reprocessed successfully`);
            })
            .catch((error) => {
                console.error(`❌ Document ${document._id} reprocessing failed:`, error);
            });

        res.status(200).json({
            success: true,
            message: 'Document reprocessing started'
        });
    } catch (error) {
        console.error('Reprocess document error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reprocess document'
        });
    }
};
