import crypto from 'crypto';
import { User, OTP } from '../models/index.js';
import emailService from '../services/emailService.js';
import {
    validatePassword,
    generateTokens,
    clearTokens,
    refreshAccessToken,
    hashToken
} from '../utils/authUtils.js';

// @desc    Register new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password
        });

        // Generate verification token
        const verificationToken = user.generateVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Hash the token to compare with stored hash
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Verify the user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = user.generateVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Send verification email
        await emailService.sendVerificationEmail(user, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${lockTime} minute(s).`
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in',
                needsVerification: true
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate tokens
        const { accessToken } = await generateTokens(user, res);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
    try {
        // Clear refresh token from user
        if (req.user) {
            await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
        }

        // Clear cookies
        clearTokens(res);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        const result = await refreshAccessToken(token, res);

        if (result.error) {
            clearTokens(res);
            return res.status(401).json({
                success: false,
                message: result.error
            });
        }

        res.status(200).json({
            success: true,
            accessToken: result.accessToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        clearTokens(res);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link.'
            });
        }

        // Generate reset token
        const resetToken = user.generateResetToken();
        await user.save({ validateBeforeSave: false });

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(user, resetToken);
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request',
            error: error.message
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Validate new password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Find user with valid reset token
        const hashedToken = hashToken(token);
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.refreshToken = undefined; // Invalidate all sessions
        await user.save();

        // Clear any existing tokens
        clearTokens(res);

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please log in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, avatar },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        const user = await User.findById(req.user.userId).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Set new password
        user.password = newPassword;
        user.refreshToken = undefined; // Invalidate all sessions
        await user.save();

        // Generate new tokens
        const { accessToken } = await generateTokens(user, res);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            accessToken
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
export const sendOTP = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email: email.toLowerCase() });

        // Generate 6-digit OTP
        const otp = OTP.generateOTP();

        // Create OTP record (expires in 10 minutes)
        await OTP.create({
            email: email.toLowerCase(),
            name,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Send OTP email
        try {
            await emailService.sendOTPEmail({ name, email }, otp);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification code. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email'
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code',
            error: error.message
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and verification code are required'
            });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            expiresAt: { $gt: Date.now() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Verification code expired. Please request a new one.'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request a new code.'
            });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: 'Code verified successfully'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message
        });
    }
};

// @desc    Complete registration after OTP verification
// @route   POST /api/auth/complete-registration
export const completeRegistration = async (req, res) => {
    try {
        const { name, email, otp, password } = req.body;

        if (!name || !email || !otp || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Find verified OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp,
            verified: true,
            expiresAt: { $gt: Date.now() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification. Please start over.'
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Check if user already exists (in case of race condition)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user (already verified since OTP was verified)
        const user = await User.create({
            name: otpRecord.name,
            email: email.toLowerCase(),
            password,
            isVerified: true
        });

        // Delete OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Complete registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};
