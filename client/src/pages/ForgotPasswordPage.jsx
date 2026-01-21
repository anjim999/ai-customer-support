import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setIsSubmitted(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="card-glass text-center">
                        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-white/60 mb-6">
                            If an account exists with <span className="text-white font-medium">{email}</span>, you'll receive a password reset link shortly.
                        </p>
                        <Link to="/login" className="btn-secondary inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
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
                {/* Back Link */}
                <Link to="/login" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>

                <div className="card-glass">
                    <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                    <p className="text-white/60 mb-6">
                        No worries! Enter your email and we'll send you a reset link.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input-glass pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
