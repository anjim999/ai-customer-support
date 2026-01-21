import express from 'express';
import {
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    refreshToken,
    getMe,
    updateProfile,
    changePassword,
    sendOTP,
    verifyOTP,
    completeRegistration
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, resetLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// OTP registration routes
router.post('/send-otp', authLimiter, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/complete-registration', authLimiter, completeRegistration);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
