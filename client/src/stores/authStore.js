import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // Initialize auth state from token
    initialize: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        try {
            const response = await authAPI.getMe();
            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            localStorage.removeItem('accessToken');
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    },

    // Register
    register: async (data) => {
        set({ error: null });
        try {
            const response = await authAPI.register(data);
            return { success: true, data: response.data };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            set({ error: message });
            return { success: false, error: message };
        }
    },

    // Login
    login: async (data) => {
        set({ error: null });
        try {
            const response = await authAPI.login(data);
            const { accessToken, user } = response.data;

            localStorage.setItem('accessToken', accessToken);
            set({
                user,
                isAuthenticated: true,
                error: null
            });

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            set({ error: message });
            return { success: false, error: message, needsVerification: error.response?.data?.needsVerification };
        }
    },

    // Logout
    logout: async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            set({
                user: null,
                isAuthenticated: false,
                error: null
            });
        }
    },

    // Update user
    updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
    },

    // Clear error
    clearError: () => set({ error: null })
}));

export default useAuthStore;
