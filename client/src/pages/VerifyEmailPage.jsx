import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { authAPI } from '../services/api';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token) {
            verifyEmail();
        } else {
            setStatus('error');
            setMessage('No verification token provided');
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await authAPI.verifyEmail(token);
            setStatus('success');
            setMessage(response.data.message);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md text-center"
            >
                <div className="card-glass">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-16 h-16 text-primary-400 mx-auto mb-4 animate-spin" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verifying your email...</h2>
                            <p className="text-white/60">Please wait while we verify your email address.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-12 h-12 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                            <p className="text-white/60 mb-6">{message}</p>
                            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                                Continue to Login
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-12 h-12 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                            <p className="text-white/60 mb-6">{message}</p>
                            <div className="space-y-3">
                                <Link to="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                                    Go to Login
                                </Link>
                                <p className="text-sm text-white/40">
                                    Need a new verification link?{' '}
                                    <Link to="/login" className="text-primary-400 hover:text-primary-300">
                                        Request from login page
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
