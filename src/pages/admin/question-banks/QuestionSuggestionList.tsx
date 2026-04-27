import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    questionSuggestionApi, 
    questionBankApi, 
    QuestionSuggestion, 
    QuestionBank
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Check,
    X,
    ArrowLeft,
    MessageSquare,
    User,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

const MySwal = withReactContent(Swal);

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function StatusBadge({ state, label }: { state: string, label: string }) {
    const configs: Record<string, { bg: string, text: string, icon: any }> = {
        pending: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
        approved: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
        rejected: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', icon: XCircle },
    };

    const config = configs[state] || configs.pending;
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
            config.bg,
            config.text
        )}>
            <Icon className="size-3" />
            {label}
        </span>
    );
}

export default function QuestionSuggestionList() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();

    const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBankLoading, setIsBankLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchBank = async () => {
        if (!id) return;
        setIsBankLoading(true);
        try {
            const response = await questionBankApi.getQuestionBank(id);
            if (response.success) {
                setBank(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch bank', error);
        } finally {
            setIsBankLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await questionSuggestionApi.getSuggestionsByQuestionBank(id, {
                page,
                per_page: 10,
                search: searchQuery,
            });
            if (response.success) {
                const result = response.data as any;
                const items = Array.isArray(result) ? result : (result.data || []);
                setSuggestions(items);

                const meta = result.meta || (response as any).meta;
                if (meta) {
                    setTotalPages(meta.last_page);
                    setTotalItems(meta.total);
                }
            }
        } catch (error) {
            console.error('Failed to fetch suggestions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBank();
    }, [id]);

    useEffect(() => {
        fetchSuggestions();
    }, [id, page, searchQuery]);

    const handleApprove = async (suggestionId: string) => {
        const result = await MySwal.fire({
            title: 'Approve Suggestion?',
            text: "This will apply the suggested changes to the question.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, approve it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await questionSuggestionApi.approveSuggestion(suggestionId);
                if (res.success) {
                    MySwal.fire('Approved!', 'Changes have been applied.', 'success');
                    fetchSuggestions();
                }
            } catch (error: any) {
                console.error('Failed to approve', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to approve suggestion.', 'error');
            }
        }
    };

    const handleReject = async (suggestionId: string) => {
        const result = await MySwal.fire({
            title: 'Reject Suggestion?',
            text: "Are you sure you want to reject this suggestion?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, reject it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await questionSuggestionApi.rejectSuggestion(suggestionId);
                if (res.success) {
                    MySwal.fire('Rejected!', 'Suggestion has been rejected.', 'success');
                    fetchSuggestions();
                }
            } catch (error: any) {
                console.error('Failed to reject', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to reject suggestion.', 'error');
            }
        }
    };

    const handleDelete = async (suggestionId: string) => {
        const result = await MySwal.fire({
            title: 'Delete Suggestion?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await questionSuggestionApi.deleteSuggestion(suggestionId);
                if (res.success) {
                    MySwal.fire('Deleted!', 'Suggestion has been deleted.', 'success');
                    fetchSuggestions();
                }
            } catch (error: any) {
                console.error('Failed to delete', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to delete suggestion.', 'error');
            }
        }
    };

    const openReview = (suggestion: QuestionSuggestion) => {
        navigate(`/admin/question-banks/${id}/suggestions/${suggestion.id}/review`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/question-bank-reviewers')}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
                    >
                        <ArrowLeft className="size-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Question Suggestions</h2>
                            {isBankLoading ? (
                                <Skeleton className="h-6 w-32 rounded-full" />
                            ) : bank && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                    {bank.name}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Review and manage suggested improvements for this question bank.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Suggestions</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-300">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <Search className="size-5" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search suggestions..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="pl-8 pr-4 py-4 w-12 text-xs font-black text-slate-400 uppercase tracking-widest text-center">#</th>
                                <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Question</th>
                                <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Suggester</th>
                                <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        <td className="pl-8 pr-4 py-5 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-4 w-64" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-8 py-5 text-right"><Skeleton className="h-9 w-24 rounded-lg ml-auto" /></td>
                                    </tr>
                                ))
                            ) : suggestions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-500 bg-slate-50/10 dark:bg-slate-800/5">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
                                                <MessageSquare className="size-10 text-slate-300" />
                                            </div>
                                            <p className="font-bold text-lg text-slate-400">No suggestions found.</p>
                                            <p className="text-sm text-slate-400">Wait for reviewers to suggest improvements.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : suggestions.map((suggestion, index) => (
                                <tr
                                    key={suggestion.id}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <td className="pl-8 pr-4 py-5 text-center text-slate-400 text-sm font-bold">
                                        {(page - 1) * 10 + index + 1}
                                    </td>
                                    <td className="px-4 py-5 max-w-md">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
                                                <MathRenderer content={suggestion.question?.content || 'Deleted question'} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                    ID: {suggestion.question_id.slice(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm">
                                                <User className="size-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                {suggestion.user?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <StatusBadge state={suggestion.state} label={suggestion.state_label} />
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                {timeAgo(suggestion.created_at)}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(suggestion.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openReview(suggestion)}
                                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                            >
                                                <Eye className="size-3.5" />
                                                Review
                                            </button>
                                            {suggestion.state === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(suggestion.id)}
                                                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all shadow-sm active:scale-95 border border-transparent hover:border-green-200 dark:hover:border-green-800"
                                                        title="Approve"
                                                    >
                                                        <Check className="size-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(suggestion.id)}
                                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm active:scale-95 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                        title="Reject"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(suggestion.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shadow-sm active:scale-95 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalItems)} of {totalItems} Suggestions
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="size-5 text-slate-500" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={cn(
                                    "size-9 flex items-center justify-center rounded-xl text-xs font-black transition-all shadow-sm active:scale-95",
                                    page === p 
                                        ? 'bg-primary text-white border border-primary' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                )}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                        >
                            <ChevronRight className="size-5 text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
