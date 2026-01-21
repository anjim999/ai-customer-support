import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete when expired
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generate 6-digit OTP
otpSchema.statics.generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
