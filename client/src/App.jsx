import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/chat" replace />;
    }

    return children;
};

// Public Route - redirects to chat if already authenticated
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/chat" replace />;
    }

    return children;
};

function App() {
    const { initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <BrowserRouter>
            {/* Background */}
            <div className="particles-bg" />

            {/* Toast notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'rgba(26, 27, 31, 0.9)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#667eea',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#f5576c',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

                {/* Protected routes */}
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
