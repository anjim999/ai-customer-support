import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    metadata: {
        startPage: Number,
        endPage: Number,
        heading: String
    }
});

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },

    // Extracted content
    rawContent: {
        type: String,
        select: false
    },
    chunks: [documentChunkSchema],

    // Processing status
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'error'],
        default: 'pending'
    },
    processingError: {
        type: String,
        default: null
    },

    // Metadata
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalChunks: {
        type: Number,
        default: 0
    },
    wordCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search
documentSchema.index({ title: 'text', description: 'text' });
documentSchema.index({ status: 1, isActive: 1 });

// Update chunk count before saving
documentSchema.pre('save', function (next) {
    this.totalChunks = this.chunks.length;
    next();
});

const Document = mongoose.model('Document', documentSchema);
export default Document;
