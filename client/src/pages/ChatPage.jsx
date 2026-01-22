import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    Send,
    Plus,
    MessageSquare,
    Trash2,
    LogOut,
    Settings,
    Menu,
    X,
    Bot,
    User,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';

const ChatPage = () => {
    const { user, logout } = useAuthStore();
    const {
        conversations,
        currentConversation,
        messages,
        isStreaming,
        streamingMessage,
        isSending,
        fetchConversations,
        fetchConversation,
        createConversation,
        sendMessage,
        deleteConversation,
        clearCurrentConversation,
        resetStore
    } = useChatStore();

    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleNewChat = async () => {
        const conversation = await createConversation();
        if (conversation) {
            toast.success('New conversation started');
        }
    };

    const handleSelectConversation = (id) => {
        fetchConversation(id);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        if (!currentConversation) {
            const conversation = await createConversation();
            if (!conversation) return;
        }

        const message = input.trim();
        setInput('');
        await sendMessage(message);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this conversation?')) {
            await deleteConversation(id);
            toast.success('Conversation deleted');
        }
    };

    const handleLogout = async () => {
        resetStore(); // Clear all chat data before logout
        await logout();
        toast.success('Logged out successfully');
    };

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed md:relative z-30 w-72 h-full flex flex-col glass-dark"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-white/5">
                            <button
                                onClick={handleNewChat}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Chat
                            </button>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {conversations.map((conv) => (
                                <motion.div
                                    key={conv._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${currentConversation?._id === conv._id
                                        ? 'bg-primary-500/20 border border-primary-500/30'
                                        : 'hover:bg-white/5'
                                        }`}
                                    onClick={() => handleSelectConversation(conv._id)}
                                >
                                    <MessageSquare className="w-5 h-5 text-white/60 flex-shrink-0" />
                                    <span className="flex-1 truncate text-sm text-white/80">
                                        {conv.title}
                                    </span>
                                    <button
                                        onClick={(e) => handleDelete(conv._id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </motion.div>
                            ))}

                            {conversations.length === 0 && (
                                <div className="text-center py-8 text-white/40">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No conversations yet</p>
                                    <p className="text-sm">Start a new chat!</p>
                                </div>
                            )}
                        </div>

                        {/* User Section */}
                        <div className="p-4 border-t border-white/5">
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                        <p className="text-xs text-white/40 truncate">{user?.email}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* User Menu Dropdown */}
                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl glass border border-white/10"
                                        >
                                            {user?.role === 'admin' && (
                                                <Link
                                                    to="/admin"
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-white/80"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full">
                {/* Header */}
                <header className="flex items-center gap-4 p-4 border-b border-white/5 glass-dark">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-white">
                            {currentConversation?.title || 'AI Support Assistant'}
                        </h1>
                        <p className="text-sm text-white/40">Powered by Gemini AI</p>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && !currentConversation && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold gradient-text mb-2">How can I help you today?</h2>
                            <p className="text-white/60 max-w-md">
                                I'm your AI support assistant. Ask me anything about our products, services, or get help with any issues.
                            </p>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                                {[
                                    'What services do you offer?',
                                    'How do I get started?',
                                    'I need help with my account',
                                    'What are your business hours?'
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            setInput(suggestion);
                                            inputRef.current?.focus();
                                        }}
                                        className="p-4 rounded-xl glass hover:bg-white/10 text-left text-sm text-white/80 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message List */}
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user'
                                ? 'bg-primary-500'
                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                }`}>
                                {msg.role === 'user' ? (
                                    <User className="w-5 h-5 text-white" />
                                ) : (
                                    <Bot className="w-5 h-5 text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                <div className={`inline-block p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-primary-500 text-white'
                                    : 'glass text-white/90'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <p>{msg.content}</p>
                                    ) : (
                                        <div className="markdown-content">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Streaming Message */}
                    {isStreaming && streamingMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 max-w-[80%]">
                                <div className="inline-block p-4 rounded-2xl glass text-white/90">
                                    <div className="markdown-content">
                                        <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Typing Indicator */}
                    {isSending && !streamingMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="glass p-4 rounded-2xl flex gap-1">
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 glass-dark">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto">
                        <div className="relative flex items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="input-glass pr-14 py-4"
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={isSending || !input.trim()}
                                className="absolute right-2 p-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-xs text-white/30 mt-3">
                        AI can make mistakes. Check important info.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ChatPage;
