import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/index.js';

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validatePassword = (password) => {
    if (!PASSWORD_REGEX.test(password)) {
        return {
            valid: false,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
        };
    }
    return { valid: true };
};

// Generate Access Token (short-lived)
export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
    );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

// Hash token for storage
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate token pair and set refresh token cookie
export const generateTokens = async (user, res) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash and store refresh token
    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { accessToken };
};

// Clear refresh token cookie
export const clearTokens = (res) => {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
    });
};

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken, res) => {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        return { error: 'Invalid refresh token' };
    }

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user) {
        return { error: 'User not found' };
    }

    // Verify the refresh token matches what's stored
    const hashedToken = hashToken(refreshToken);
    if (user.refreshToken !== hashedToken) {
        // Token was revoked or doesn't match
        return { error: 'Invalid refresh token' };
    }

    // Generate new token pair (rotation)
    return await generateTokens(user, res);
};
