import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const response = await axios.post(
                    `${API_URL}/api/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    resendVerification: (email) => api.post('/auth/resend-verification', { email }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    updateProfile: (data) => api.put('/auth/update-profile', data),
    changePassword: (data) => api.put('/auth/change-password', data),
    // OTP endpoints
    sendOTP: (data) => api.post('/auth/send-otp', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    completeRegistration: (data) => api.post('/auth/complete-registration', data)
};

// Chat API
export const chatAPI = {
    getConversations: (params) => api.get('/chat/conversations', { params }),
    getConversation: (id) => api.get(`/chat/conversations/${id}`),
    createConversation: () => api.post('/chat/conversations'),
    deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
    clearMessages: (id) => api.delete(`/chat/conversations/${id}/messages`),
    sendMessage: (id, message) => api.post(`/chat/conversations/${id}/messages`, { message })
};

// Document API
export const documentAPI = {
    getDocuments: (params) => api.get('/documents', { params }),
    getDocument: (id) => api.get(`/documents/${id}`),
    uploadDocument: (formData) => api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateDocument: (id, data) => api.put(`/documents/${id}`, data),
    deleteDocument: (id) => api.delete(`/documents/${id}`),
    reprocessDocument: (id) => api.post(`/documents/${id}/reprocess`)
};

// FAQ API
export const faqAPI = {
    getFAQs: (params) => api.get('/faqs', { params }),
    getFAQ: (id) => api.get(`/faqs/${id}`),
    createFAQ: (data) => api.post('/faqs', data),
    updateFAQ: (id, data) => api.put(`/faqs/${id}`, data),
    deleteFAQ: (id) => api.delete(`/faqs/${id}`),
    markHelpful: (id, helpful) => api.post(`/faqs/${id}/helpful`, { helpful })
};

export default api;
