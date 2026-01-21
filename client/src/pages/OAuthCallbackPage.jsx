import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const OAuthCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { initialize } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=oauth_failed');
            return;
        }

        if (token) {
            // Store the token
            localStorage.setItem('accessToken', token);

            // Re-initialize auth state
            initialize().then(() => {
                navigate('/chat');
            });
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate, initialize]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-spin" />
                <p className="text-white/60">Completing sign in...</p>
            </div>
        </div>
    );
};

export default OAuthCallbackPage;
