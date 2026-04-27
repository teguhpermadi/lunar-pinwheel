import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    questionSuggestionApi, 
    QuestionSuggestion,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MessageSquare,
    User,
    Calendar,
    AlertCircle,
    Clock,
    Trash2,
    Zap,
    History
} from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

const MySwal = withReactContent(Swal);

function StatusBadge({ state, label }: { state: string, label: string }) {
    const configs: Record<string, { bg: string, border: string, text: string, icon: any }> = {
        pending: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
        approved: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        rejected: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', icon: XCircle },
    };

    const config = configs[state] || configs.pending;
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-md",
            config.bg,
            config.border,
            config.text
        )}>
            <Icon className="size-3" />
            {label}
        </span>
    );
}

export default function ReviewQuestionSuggestion() {
    const { bankId, suggestionId } = useParams<{ bankId: string, suggestionId: string }>();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();

    const [suggestion, setSuggestion] = useState<QuestionSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuggestion = async () => {
        if (!suggestionId) return;
        setIsLoading(true);
        try {
            const response = await questionSuggestionApi.getSuggestion(suggestionId);
            if (response.success) {
                setSuggestion(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch suggestion', error);
            MySwal.fire('Error', 'Failed to load suggestion details.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestion();
    }, [suggestionId]);

    const handleApprove = async () => {
        if (!suggestion) return;
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
                const res = await questionSuggestionApi.approveSuggestion(suggestion.id);
                if (res.success) {
                    await MySwal.fire('Approved!', 'Changes have been applied.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to approve', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to approve suggestion.', 'error');
            }
        }
    };

    const handleReject = async () => {
        if (!suggestion) return;
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
                const res = await questionSuggestionApi.rejectSuggestion(suggestion.id);
                if (res.success) {
                    await MySwal.fire('Rejected!', 'Suggestion has been rejected.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to reject', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to reject suggestion.', 'error');
            }
        }
    };

    const handleDelete = async () => {
        if (!suggestion) return;
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
                const res = await questionSuggestionApi.deleteSuggestion(suggestion.id);
                if (res.success) {
                    MySwal.fire('Deleted!', 'Suggestion has been deleted.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to delete', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to delete suggestion.', 'error');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[500px] rounded-3xl" />
                    <Skeleton className="h-[500px] rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!suggestion) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
                <AlertCircle className="size-12 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Suggestion Not Found</h3>
                <button 
                    onClick={() => navigate(`/admin/question-banks/${bankId}/suggestions`)}
                    className="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm"
                >
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 space-y-6 max-w-[1440px] mx-auto pb-32"
        >
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/admin/question-banks/${bankId}/suggestions`)}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
                    >
                        <ArrowLeft className="size-5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Review Suggestion</h2>
                            <StatusBadge state={suggestion.state} label={suggestion.state_label} />
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <User className="size-3.5 text-primary" />
                                {suggestion.user?.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <Calendar className="size-3.5 text-primary" />
                                {new Date(suggestion.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all border border-transparent"
                            title="Delete Suggestion"
                        >
                            <Trash2 className="size-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Compact Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Content Card */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <History className="size-3" />
                        Original Content
                    </h4>
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="p-6 lg:p-8 space-y-6 flex-1">
                            <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px] font-medium selection:bg-primary/20">
                                <MathRenderer content={suggestion.question?.content || ''} />
                            </div>

                            {suggestion.question?.options && (
                                <div className="space-y-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Options</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {suggestion.question.options.map((opt: any) => (
                                            <div 
                                                key={opt.id} 
                                                className={cn(
                                                    "p-3.5 rounded-xl border flex items-center justify-between transition-all group",
                                                    opt.is_correct 
                                                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                                                        : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={cn(
                                                        "size-8 flex items-center justify-center rounded-lg text-xs font-black",
                                                        opt.is_correct ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                    )}>
                                                        {opt.option_key}
                                                    </span>
                                                    <div className="text-[13px] font-bold">
                                                        <MathRenderer content={opt.content} />
                                                    </div>
                                                </div>
                                                {opt.is_correct && <CheckCircle2 className="size-4 text-emerald-500" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Suggested Changes Card */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Zap className="size-3" />
                        Suggested Changes
                    </h4>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-primary/20 dark:border-primary/30 shadow-xl shadow-primary/5 overflow-hidden flex flex-col min-h-[400px] ring-1 ring-primary/5">
                        <div className="p-6 lg:p-8 space-y-6 flex-1">
                            <div className="selection:bg-primary/20">
                                {suggestion.data?.content ? (
                                    <div className="text-slate-900 dark:text-white leading-relaxed text-[15px] font-bold bg-primary/5 p-5 rounded-2xl border border-primary/10">
                                        <MathRenderer content={suggestion.data.content} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 text-xs italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <AlertCircle className="size-4" />
                                        No content changes proposed.
                                    </div>
                                )}
                            </div>

                            {suggestion.data?.options && (
                                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-wider mb-2">Refined Options</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {suggestion.question?.options?.map((origOpt: any) => {
                                            const updatedOpt = suggestion.data?.options?.update?.find((u: any) => u.id === origOpt.id);
                                            const opt = updatedOpt || origOpt;
                                            const isModified = !!updatedOpt;

                                            return (
                                                <div 
                                                    key={origOpt.id} 
                                                    className={cn(
                                                        "p-3.5 rounded-xl border flex items-center justify-between transition-all relative overflow-hidden",
                                                        opt.is_correct 
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm",
                                                        isModified && "border-amber-400/50 bg-amber-400/5 ring-1 ring-amber-400/20"
                                                    )}
                                                >
                                                    {isModified && (
                                                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-400 text-[8px] font-black text-white uppercase rounded-bl-lg">
                                                            EDITED
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "size-8 flex items-center justify-center rounded-lg text-xs font-black",
                                                            opt.is_correct ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                        )}>
                                                            {opt.option_key || origOpt.option_key}
                                                        </span>
                                                        <div className="text-[13px] font-bold">
                                                            <MathRenderer content={opt.content} />
                                                        </div>
                                                    </div>
                                                    {opt.is_correct && <CheckCircle2 className="size-4 text-emerald-500" />}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* New Options */}
                                        {suggestion.data?.options?.create?.map((newOpt: any, idx: number) => (
                                            <div 
                                                key={`new-${idx}`}
                                                className={cn(
                                                    "p-3.5 rounded-xl border-2 border-dashed flex items-center justify-between transition-all relative overflow-hidden",
                                                    newOpt.is_correct 
                                                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
                                                        : "bg-primary/5 border-primary/20 text-primary-700 dark:text-primary-400"
                                                )}
                                            >
                                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-[8px] font-black text-white uppercase rounded-bl-lg">
                                                    NEW
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="size-8 flex items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] font-black">
                                                        +
                                                    </span>
                                                    <div className="text-[13px] font-bold">
                                                        <MathRenderer content={newOpt.content} />
                                                    </div>
                                                </div>
                                                {newOpt.is_correct && <CheckCircle2 className="size-4 text-emerald-500" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note & Action Footer within Main Content */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 max-w-2xl">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 flex-shrink-0 shadow-sm">
                            <MessageSquare className="size-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Suggester's Note</p>
                            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium italic leading-relaxed">
                                "{suggestion.description || 'No additional note provided.'}"
                            </p>
                        </div>
                    </div>

                    {suggestion.state === 'pending' && (
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleReject}
                                className="flex-1 md:flex-none px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 font-black text-[11px] rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                <XCircle className="size-4" />
                                Reject Suggestion
                            </button>
                            <button
                                onClick={handleApprove}
                                className="flex-1 md:flex-none px-8 py-2.5 bg-primary hover:bg-primary/90 text-white font-black text-[11px] rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="size-4" />
                                Approve & Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
