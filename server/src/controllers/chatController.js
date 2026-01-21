import { Conversation, Document, FAQ } from '../models/index.js';
import geminiService from '../services/geminiService.js';
import ragService from '../services/ragService.js';

// @desc    Create new conversation
// @route   POST /api/chat/conversations
export const createConversation = async (req, res) => {
    try {
        const conversation = await Conversation.create({
            user: req.user.userId,
            title: 'New Conversation',
            messages: []
        });

        res.status(201).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create conversation'
        });
    }
};

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
export const getConversations = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const conversations = await Conversation.find({
            user: req.user.userId,
            status: { $ne: 'deleted' }
        })
            .select('title status metadata createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Conversation.countDocuments({
            user: req.user.userId,
            status: { $ne: 'deleted' }
        });

        res.status(200).json({
            success: true,
            conversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations'
        });
    }
};

// @desc    Get single conversation with messages
// @route   GET /api/chat/conversations/:id
export const getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation'
        });
    }
};

// @desc    Send message (non-streaming)
// @route   POST /api/chat/conversations/:id/messages
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const conversationId = req.params.id;

        // Find conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user: req.user.userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Add user message
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // Get relevant context from documents (RAG)
        let companyContext = '';
        try {
            const relevantChunks = await ragService.findRelevantChunks(message, 3);
            if (relevantChunks.length > 0) {
                companyContext = relevantChunks.map(chunk => chunk.content).join('\n\n');
            }
        } catch (ragError) {
            console.error('RAG error (continuing without context):', ragError);
        }

        // Get relevant FAQs
        const faqs = await FAQ.find({ isActive: true })
            .select('question answer')
            .limit(5);

        // Get last 10 messages for context
        const recentMessages = conversation.messages.slice(-10);

        // Get AI response
        const startTime = Date.now();
        const aiResponse = await geminiService.chat(
            message,
            recentMessages.slice(0, -1), // Exclude the just-added user message
            { companyContext, faqs }
        );
        const processingTime = Date.now() - startTime;

        // Add assistant message
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse.message,
            metadata: {
                tokensUsed: aiResponse.tokensUsed,
                model: 'gemini-1.5-flash',
                processingTime
            }
        });

        // Update conversation metadata
        conversation.metadata.totalTokens += aiResponse.tokensUsed;

        // Generate title from first message if not set
        if (conversation.title === 'New Conversation') {
            conversation.generateTitle();
        }

        await conversation.save();

        res.status(200).json({
            success: true,
            message: {
                role: 'assistant',
                content: aiResponse.message,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// @desc    Send message with streaming
// @route   POST /api/chat/conversations/:id/stream
export const streamMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const conversationId = req.params.id;

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Find conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user: req.user.userId
        });

        if (!conversation) {
            res.write(`data: ${JSON.stringify({ type: 'error', error: 'Conversation not found' })}\n\n`);
            return res.end();
        }

        // Add user message
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // Get relevant context from documents (RAG)
        let companyContext = '';
        try {
            const relevantChunks = await ragService.findRelevantChunks(message, 3);
            if (relevantChunks.length > 0) {
                companyContext = relevantChunks.map(chunk => chunk.content).join('\n\n');
            }
        } catch (ragError) {
            console.error('RAG error (continuing without context):', ragError);
        }

        // Get relevant FAQs
        const faqs = await FAQ.find({ isActive: true })
            .select('question answer')
            .limit(5);

        // Get last 10 messages for context
        const recentMessages = conversation.messages.slice(-10);

        // Stream AI response
        let fullResponse = '';
        let tokensUsed = 0;
        const startTime = Date.now();

        const stream = geminiService.streamChat(
            message,
            recentMessages.slice(0, -1),
            { companyContext, faqs }
        );

        for await (const chunk of stream) {
            if (chunk.type === 'chunk') {
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
            } else if (chunk.type === 'complete') {
                tokensUsed = chunk.tokensUsed;
            } else if (chunk.type === 'error') {
                res.write(`data: ${JSON.stringify({ type: 'error', error: chunk.error })}\n\n`);
                return res.end();
            }
        }

        const processingTime = Date.now() - startTime;

        // Add assistant message
        conversation.messages.push({
            role: 'assistant',
            content: fullResponse,
            metadata: {
                tokensUsed,
                model: 'gemini-1.5-flash',
                processingTime
            }
        });

        // Update conversation metadata
        conversation.metadata.totalTokens += tokensUsed;

        // Generate title from first message if not set
        if (conversation.title === 'New Conversation') {
            conversation.generateTitle();
        }

        await conversation.save();

        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Stream message error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to stream message' })}\n\n`);
        res.end();
    }
};

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
export const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { status: 'deleted' },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation deleted'
        });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete conversation'
        });
    }
};

// @desc    Clear conversation history
// @route   DELETE /api/chat/conversations/:id/messages
export const clearMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            {
                messages: [],
                'metadata.messageCount': 0,
                'metadata.totalTokens': 0,
                title: 'New Conversation'
            },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation cleared'
        });
    } catch (error) {
        console.error('Clear messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear conversation'
        });
    }
};
