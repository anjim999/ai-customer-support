import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        tokensUsed: Number,
        model: String,
        processingTime: Number,
        sources: [{
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            chunkIndex: Number,
            relevanceScore: Number
        }]
    }
}, {
    timestamps: true
});

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [messageSchema],
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    },
    metadata: {
        totalTokens: { type: Number, default: 0 },
        messageCount: { type: Number, default: 0 },
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative', null], default: null },
        topics: [String],
        resolved: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Index for efficient queries
conversationSchema.index({ user: 1, createdAt: -1 });
conversationSchema.index({ status: 1 });

// Update message count before saving
conversationSchema.pre('save', function (next) {
    this.metadata.messageCount = this.messages.length;
    next();
});

// Generate title from first user message
conversationSchema.methods.generateTitle = function () {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        this.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    }
    return this.title;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
