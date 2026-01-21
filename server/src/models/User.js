import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function () { return !this.googleId; },
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },

    // Email Verification
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false
    },
    verificationTokenExpires: {
        type: Date,
        select: false
    },

    // Password Reset
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },

    // Google OAuth
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },

    // Security
    isActive: {
        type: Boolean,
        default: true
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },

    // Refresh Token
    refreshToken: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Generate password reset token
userSchema.methods.generateResetToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
    }

    return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: 1 }
    });
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.verificationToken;
    delete obj.verificationTokenExpires;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
