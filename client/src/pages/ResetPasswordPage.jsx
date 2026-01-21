import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Password strength checker
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };

    const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch = password === confirmPassword && confirmPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Invalid reset link');
            return;
        }

        if (!isPasswordStrong) {
            toast.error('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await authAPI.resetPassword(token, password);
            toast.success('Password reset successful! Please log in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordCheck = ({ passed, label }) => (
        <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-400' : 'text-white/40'}`}>
            {passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {label}
        </div>
    );

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="card-glass text-center max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
                    <p className="text-white/60 mb-6">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link to="/forgot-password" className="btn-primary">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="card-glass">
                    <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-white/60 mb-6">Enter your new password below.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                            {password && (
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

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className={`input-glass pl-12 pr-12 ${confirmPassword && (passwordsMatch ? 'border-green-500' : 'border-red-500')
                                        }`}
                                    required
                                />
                                {confirmPassword && (
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

                        <button
                            type="submit"
                            disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
