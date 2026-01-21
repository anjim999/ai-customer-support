import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question is required'],
        trim: true
    },
    answer: {
        type: String,
        required: [true, 'Answer is required']
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewCount: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    notHelpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Text index for search
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ priority: -1 });

// Virtual for helpfulness score
faqSchema.virtual('helpfulnessScore').get(function () {
    const total = this.helpfulCount + this.notHelpfulCount;
    return total > 0 ? (this.helpfulCount / total) * 100 : 0;
});

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
