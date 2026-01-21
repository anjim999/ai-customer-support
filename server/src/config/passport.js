import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';

export const configurePassport = () => {
    // Only configure if credentials are provided
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.log('⚠️ Google OAuth not configured (missing credentials)');
        return;
    }

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // Check if user exists with this email
            const email = profile.emails[0].value;
            user = await User.findOne({ email });

            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.isVerified = true; // Google accounts are pre-verified
                if (!user.avatar && profile.photos[0]) {
                    user.avatar = profile.photos[0].value;
                }
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos[0]?.value || null,
                isVerified: true // Google accounts are pre-verified
            });

            done(null, user);
        } catch (error) {
            done(error, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    console.log('✅ Google OAuth configured');
};
