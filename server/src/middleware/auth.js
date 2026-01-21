import { verifyAccessToken } from '../utils/authUtils.js';
import { User } from '../models/index.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token invalid or expired'
            });
        }

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Attach user to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = verifyAccessToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }

        next();
    } catch (error) {
        next();
    }
};
