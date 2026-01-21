import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    MessageSquareText,
    Upload,
    Trash2,
    Plus,
    ArrowLeft,
    Edit,
    Save,
    X,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentAPI, faqAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const AdminPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('documents');

    // Documents state
    const [documents, setDocuments] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [uploadingFile, setUploadingFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // FAQs state
    const [faqs, setFaqs] = useState([]);
    const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
    const [editingFaq, setEditingFaq] = useState(null);
    const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'General' });
    const [showNewFaqForm, setShowNewFaqForm] = useState(false);

    useEffect(() => {
        fetchDocuments();
        fetchFaqs();
    }, []);

    // Document functions
    const fetchDocuments = async () => {
        try {
            const response = await documentAPI.getDocuments();
            setDocuments(response.data.documents);
        } catch (error) {
            toast.error('Failed to load documents');
        } finally {
            setIsLoadingDocs(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

        setUploadingFile(file.name);
        setUploadProgress(0);

        try {
            await documentAPI.uploadDocument(formData);
            toast.success('Document uploaded successfully');
            fetchDocuments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingFile(null);
            e.target.value = '';
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!confirm('Delete this document?')) return;

        try {
            await documentAPI.deleteDocument(id);
            setDocuments(documents.filter(d => d._id !== id));
            toast.success('Document deleted');
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handleReprocess = async (id) => {
        try {
            await documentAPI.reprocessDocument(id);
            toast.success('Reprocessing started');
            fetchDocuments();
        } catch (error) {
            toast.error('Failed to reprocess');
        }
    };

    // FAQ functions
    const fetchFaqs = async () => {
        try {
            const response = await faqAPI.getFAQs();
            setFaqs(response.data.faqs);
        } catch (error) {
            toast.error('Failed to load FAQs');
        } finally {
            setIsLoadingFaqs(false);
        }
    };

    const handleCreateFaq = async (e) => {
        e.preventDefault();
        try {
            const response = await faqAPI.createFAQ(newFaq);
            setFaqs([response.data.faq, ...faqs]);
            setNewFaq({ question: '', answer: '', category: 'General' });
            setShowNewFaqForm(false);
            toast.success('FAQ created');
        } catch (error) {
            toast.error('Failed to create FAQ');
        }
    };

    const handleUpdateFaq = async (id) => {
        try {
            const response = await faqAPI.updateFAQ(id, editingFaq);
            setFaqs(faqs.map(f => f._id === id ? response.data.faq : f));
            setEditingFaq(null);
            toast.success('FAQ updated');
        } catch (error) {
            toast.error('Failed to update FAQ');
        }
    };

    const handleDeleteFaq = async (id) => {
        if (!confirm('Delete this FAQ?')) return;

        try {
            await faqAPI.deleteFAQ(id);
            setFaqs(faqs.filter(f => f._id !== id));
            toast.success('FAQ deleted');
        } catch (error) {
            toast.error('Failed to delete FAQ');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ready':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'processing':
                return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-white/40" />;
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/chat"
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
                            <p className="text-white/60">Manage documents and FAQs</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-white/60">Logged in as</p>
                        <p className="font-medium text-white">{user?.name}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'documents'
                                ? 'bg-primary-500 text-white'
                                : 'glass hover:bg-white/10 text-white/70'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        Documents ({documents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'faqs'
                                ? 'bg-primary-500 text-white'
                                : 'glass hover:bg-white/10 text-white/70'
                            }`}
                    >
                        <MessageSquareText className="w-5 h-5" />
                        FAQs ({faqs.length})
                    </button>
                </div>

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <div className="card-glass">
                            <h3 className="text-lg font-semibold text-white mb-4">Upload Document</h3>
                            <label className="relative block p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-primary-500/50 transition-colors cursor-pointer">
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={!!uploadingFile}
                                />
                                <div className="text-center">
                                    {uploadingFile ? (
                                        <>
                                            <Loader2 className="w-12 h-12 text-primary-400 mx-auto mb-3 animate-spin" />
                                            <p className="text-white">Uploading {uploadingFile}...</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                            <p className="text-white/80">Drop files here or click to upload</p>
                                            <p className="text-sm text-white/40 mt-1">Supports PDF, DOCX, TXT (max 10MB)</p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Documents List */}
                        <div className="card-glass">
                            <h3 className="text-lg font-semibold text-white mb-4">Uploaded Documents</h3>

                            {isLoadingDocs ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <motion.div
                                            key={doc._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                            <FileText className="w-10 h-10 text-primary-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{doc.title}</p>
                                                <p className="text-sm text-white/40">
                                                    {doc.totalChunks} chunks • {(doc.fileSize / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(doc.status)}
                                                {doc.status === 'error' && (
                                                    <button
                                                        onClick={() => handleReprocess(doc._id)}
                                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                        title="Reprocess"
                                                    >
                                                        <RefreshCw className="w-4 h-4 text-white/60" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteDocument(doc._id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FAQs Tab */}
                {activeTab === 'faqs' && (
                    <div className="space-y-6">
                        {/* Add FAQ Button */}
                        <button
                            onClick={() => setShowNewFaqForm(!showNewFaqForm)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add FAQ
                        </button>

                        {/* New FAQ Form */}
                        <AnimatePresence>
                            {showNewFaqForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="card-glass"
                                >
                                    <h3 className="text-lg font-semibold text-white mb-4">New FAQ</h3>
                                    <form onSubmit={handleCreateFaq} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">Question</label>
                                            <input
                                                type="text"
                                                value={newFaq.question}
                                                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                                className="input-glass"
                                                placeholder="Enter the question"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">Answer</label>
                                            <textarea
                                                value={newFaq.answer}
                                                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                                className="input-glass min-h-[100px]"
                                                placeholder="Enter the answer"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                                            <input
                                                type="text"
                                                value={newFaq.category}
                                                onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                                                className="input-glass"
                                                placeholder="General"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="btn-primary flex items-center gap-2">
                                                <Save className="w-4 h-4" />
                                                Save FAQ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewFaqForm(false)}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* FAQs List */}
                        <div className="card-glass">
                            <h3 className="text-lg font-semibold text-white mb-4">All FAQs</h3>

                            {isLoadingFaqs ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" />
                                </div>
                            ) : faqs.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <MessageSquareText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No FAQs yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {faqs.map((faq) => (
                                        <motion.div
                                            key={faq._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-xl bg-white/5"
                                        >
                                            {editingFaq?._id === faq._id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editingFaq.question}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                                        className="input-glass"
                                                    />
                                                    <textarea
                                                        value={editingFaq.answer}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                                        className="input-glass min-h-[80px]"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateFaq(faq._id)}
                                                            className="btn-primary flex items-center gap-2 py-2"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingFaq(null)}
                                                            className="btn-secondary py-2"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-white mb-2">{faq.question}</p>
                                                            <p className="text-white/60 text-sm">{faq.answer}</p>
                                                            <span className="inline-block mt-2 px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs">
                                                                {faq.category}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setEditingFaq(faq)}
                                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4 text-white/60" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFaq(faq._id)}
                                                                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
