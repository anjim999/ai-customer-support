import { create } from 'zustand';
import { chatAPI } from '../services/api';

const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    isSending: false,
    isStreaming: false,
    streamingMessage: '',
    error: null,

    // Fetch conversations
    fetchConversations: async () => {
        set({ isLoading: true });
        try {
            const response = await chatAPI.getConversations();
            set({
                conversations: response.data.conversations,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch conversations',
                isLoading: false
            });
        }
    },

    // Fetch single conversation
    fetchConversation: async (id) => {
        set({ isLoading: true });
        try {
            const response = await chatAPI.getConversation(id);
            set({
                currentConversation: response.data.conversation,
                messages: response.data.conversation.messages,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch conversation',
                isLoading: false
            });
        }
    },

    // Create new conversation
    createConversation: async () => {
        try {
            const response = await chatAPI.createConversation();
            const newConversation = response.data.conversation;

            set((state) => ({
                conversations: [newConversation, ...state.conversations],
                currentConversation: newConversation,
                messages: []
            }));

            return newConversation;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to create conversation' });
            return null;
        }
    },

    // Send message with streaming
    sendMessage: async (message) => {
        const { currentConversation } = get();
        if (!currentConversation) return;

        // Add user message optimistically
        const userMessage = {
            role: 'user',
            content: message,
            createdAt: new Date().toISOString()
        };

        set((state) => ({
            messages: [...state.messages, userMessage],
            isSending: true,
            isStreaming: true,
            streamingMessage: ''
        }));

        try {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('accessToken');

            const response = await fetch(
                `${API_URL}/api/chat/conversations/${currentConversation._id}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ message })
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullMessage = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'chunk') {
                                fullMessage += data.content;
                                set({ streamingMessage: fullMessage });
                            } else if (data.type === 'complete') {
                                // Add final assistant message
                                const assistantMessage = {
                                    role: 'assistant',
                                    content: fullMessage,
                                    createdAt: new Date().toISOString()
                                };

                                set((state) => ({
                                    messages: [...state.messages, assistantMessage],
                                    isStreaming: false,
                                    isSending: false,
                                    streamingMessage: ''
                                }));

                                // Update conversation in list
                                get().fetchConversations();
                            } else if (data.type === 'error') {
                                throw new Error(data.error);
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Send message error:', error);
            set({
                error: error.message || 'Failed to send message',
                isSending: false,
                isStreaming: false,
                streamingMessage: ''
            });
        }
    },

    // Delete conversation
    deleteConversation: async (id) => {
        try {
            await chatAPI.deleteConversation(id);
            set((state) => ({
                conversations: state.conversations.filter(c => c._id !== id),
                currentConversation: state.currentConversation?._id === id ? null : state.currentConversation,
                messages: state.currentConversation?._id === id ? [] : state.messages
            }));
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to delete conversation' });
        }
    },

    // Clear current conversation
    clearCurrentConversation: () => {
        set({
            currentConversation: null,
            messages: [],
            streamingMessage: ''
        });
    },

    // Reset entire store (for logout)
    resetStore: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            isLoading: false,
            isSending: false,
            isStreaming: false,
            streamingMessage: '',
            error: null
        });
    },

    // Clear error
    clearError: () => set({ error: null })
}));

export default useChatStore;
