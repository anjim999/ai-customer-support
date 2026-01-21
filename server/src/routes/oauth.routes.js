import express from 'express';
import passport from 'passport';
import { generateTokens } from '../utils/authUtils.js';

const router = express.Router();

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
    }),
    async (req, res) => {
        try {
            const user = req.user;

            // Generate tokens
            const { accessToken } = await generateTokens(user, res);

            // Redirect to frontend with token
            res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}`);
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
        }
    }
);

export default router;
