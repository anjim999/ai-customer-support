import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        message: 'Too many login attempts, please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

// Password reset limiter
export const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests, please try again in an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Chat message limiter
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    message: {
        success: false,
        message: 'Too many messages, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
