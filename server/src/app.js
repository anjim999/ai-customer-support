import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/database.js';
import { configurePassport } from './config/passport.js';
import { apiLimiter } from './middleware/rateLimit.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import oauthRoutes from './routes/oauth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import documentRoutes from './routes/document.routes.js';
import faqRoutes from './routes/faq.routes.js';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Configure Passport
configurePassport();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport initialization
app.use(passport.initialize());

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/faqs', faqRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`
🚀 Server running on port ${PORT}
📍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API URL: http://localhost:${PORT}
💬 WebSocket: ws://localhost:${PORT}
  `);
});

export { app, io };
