import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: name+email, 2: OTP, 3: password

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        otp: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password strength checker
    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[@$!%*?&]/.test(formData.password)
    };

    const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

    const handleChange = (e) => {
        setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authAPI.sendOTP({ name: formData.name, email: formData.email });
            toast.success('Verification code sent to your email!');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!formData.otp.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authAPI.verifyOTP({ email: formData.email, otp: formData.otp });
            toast.success('Code verified! Now set your password.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Complete Registration
    const handleCompleteRegistration = async (e) => {
        e.preventDefault();

        if (!isPasswordStrong) {
            setError('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await authAPI.completeRegistration({
                name: formData.name,
                email: formData.email,
                otp: formData.otp,
                password: formData.password
            });
            toast.success('Account created successfully!');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        try {
            await authAPI.sendOTP({ name: formData.name, email: formData.email });
            toast.success('New code sent!');
        } catch (err) {
            toast.error('Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`;
    };

    const PasswordCheck = ({ passed, label }) => (
        <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-400' : 'text-white/40'}`}>
            {passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {label}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">AI Support</h1>
                    <p className="text-white/60">Create your account</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/40'
                                }`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-12 h-0.5 mx-1 transition-all ${step > s ? 'bg-primary-500' : 'bg-white/10'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Register Card */}
                <div className="card-glass">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Name & Email */}
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOTP}
                                className="space-y-5"
                            >
                                <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="input-glass pl-12"
                                            required
                                            minLength={2}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            className="input-glass pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Send Verification Code
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 2 && (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOTP}
                                className="space-y-5"
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 text-white/60 hover:text-white mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
                                <p className="text-white/60 text-sm mb-4">
                                    We sent a 6-digit code to <span className="text-white">{formData.email}</span>
                                </p>

                                {/* OTP Input */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        placeholder="Enter 6-digit code"
                                        className="input-glass text-center text-2xl tracking-widest"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || formData.otp.length !== 6}
                                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Verify Code
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-white/60 text-sm">
                                    Didn't receive the code?{' '}
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isLoading}
                                        className="text-primary-400 hover:text-primary-300"
                                    >
                                        Resend
                                    </button>
                                </p>
                            </motion.form>
                        )}

                        {/* Step 3: Password */}
                        {step === 3 && (
                            <motion.form
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCompleteRegistration}
                                className="space-y-5"
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 text-white/60 hover:text-white mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <h2 className="text-xl font-semibold text-white mb-4">Set Your Password</h2>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a strong password"
                                            className="input-glass pl-12 pr-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {formData.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3 p-3 rounded-lg bg-dark-900/50 space-y-1"
                                        >
                                            <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                                            <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                                            <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                                            <PasswordCheck passed={passwordChecks.number} label="One number" />
                                            <PasswordCheck passed={passwordChecks.special} label="One special character (@$!%*?&)" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                            className={`input-glass pl-12 pr-12 ${formData.confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-500')
                                                }`}
                                            required
                                        />
                                        {formData.confirmPassword && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {passwordsMatch ? (
                                                    <Check className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <X className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Create Account
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Divider - only on step 1 */}
                    {step === 1 && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-dark-900/80 text-white/40">or continue with</span>
                                </div>
                            </div>

                            {/* Google Login */}
                            <button
                                onClick={handleGoogleLogin}
                                className="btn-secondary w-full flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </>
                    )}

                    {/* Login Link */}
                    <p className="mt-6 text-center text-white/60">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
