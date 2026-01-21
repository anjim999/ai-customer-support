import { FAQ } from '../models/index.js';

// @desc    Create FAQ
// @route   POST /api/faqs
export const createFAQ = async (req, res) => {
    try {
        const { question, answer, category, tags, priority } = req.body;

        const faq = await FAQ.create({
            question,
            answer,
            category: category || 'General',
            tags: tags || [],
            priority: priority || 0,
            createdBy: req.user.userId
        });

        res.status(201).json({
            success: true,
            faq
        });
    } catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create FAQ'
        });
    }
};

// @desc    Get all FAQs
// @route   GET /api/faqs
export const getFAQs = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const faqs = await FAQ.find(query)
            .populate('createdBy', 'name')
            .sort({ priority: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await FAQ.countDocuments(query);

        // Get unique categories
        const categories = await FAQ.distinct('category', { isActive: true });

        res.status(200).json({
            success: true,
            faqs,
            categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQs'
        });
    }
};

// @desc    Get single FAQ
// @route   GET /api/faqs/:id
export const getFAQ = async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        ).populate('createdBy', 'name');

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            faq
        });
    } catch (error) {
        console.error('Get FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQ'
        });
    }
};

// @desc    Update FAQ
// @route   PUT /api/faqs/:id
export const updateFAQ = async (req, res) => {
    try {
        const { question, answer, category, tags, priority, isActive } = req.body;

        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            {
                question,
                answer,
                category,
                tags,
                priority,
                isActive,
                updatedBy: req.user.userId
            },
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            faq
        });
    } catch (error) {
        console.error('Update FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update FAQ'
        });
    }
};

// @desc    Delete FAQ
// @route   DELETE /api/faqs/:id
export const deleteFAQ = async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete FAQ'
        });
    }
};

// @desc    Mark FAQ as helpful
// @route   POST /api/faqs/:id/helpful
export const markHelpful = async (req, res) => {
    try {
        const { helpful } = req.body; // true or false

        const update = helpful
            ? { $inc: { helpfulCount: 1 } }
            : { $inc: { notHelpfulCount: 1 } };

        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback recorded'
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record feedback'
        });
    }
};
