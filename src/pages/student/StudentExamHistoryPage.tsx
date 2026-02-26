import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface ExamResult {
    id: string;
    exam_id: string;
    exam_session_id: string;
    exam: {
        id: string;
        title: string;
        type: string;
        type_label: string;
        duration: number;
        is_show_result: boolean;
        subject?: {
            id: string;
            name: string;
        };
    };
    total_score: number;
    score_percent: number;
    final_score: string;
    is_passed: boolean;
    result_type_label: string;
    finished_at: string;
    created_at: string;
}

export default function StudentExamHistoryPage() {
    const [results, setResults] = useState<ExamResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const response = await studentApi.getExamResults();
            if (response.success) {
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setResults(data);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load exam history. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return { date: '-', month: '-', full: '-', time: '-' };
        const date = new Date(dateString);
        return {
            date: date.getDate().toString(),
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            full: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const groupResults = () => {
        const groups: { [key: string]: ExamResult[] } = {};

        results.forEach(result => {
            const date = new Date(result.finished_at || result.created_at);
            const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(result);
        });

        return groups;
    };

    const groupedResults = groupResults();

    return (
        <div className="flex-1 flex overflow-hidden p-6 gap-8 h-full bg-background-light dark:bg-background-dark/50">
            {/* Left side: Results List */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Exam History</h3>
                        <p className="text-sm text-slate-500 font-medium">You have completed {results.length} exams</p>
                    </div>
                    <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative timeline-line">
                    <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 z-0"></div>

                    {isLoading ? (
                        <div className="space-y-8 ml-16">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        Object.keys(groupedResults).map((group) => (
                            <div key={group} className="relative mb-8">
                                <div className="sticky top-0 z-10 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-[10px] rounded-full z-10 ml-[23px] bg-slate-300 dark:bg-slate-600"></div>
                                        <span className="text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500">
                                            {group}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-16 space-y-4">
                                    {groupedResults[group].map((result) => {
                                        const { date, month, time } = formatDate(result.finished_at || result.created_at);
                                        const isSelected = selectedResult?.id === result.id;

                                        return (
                                            <motion.div
                                                key={result.id}
                                                whileHover={{ scale: 1.01 }}
                                                onClick={() => setSelectedResult(result)}
                                                className="relative group cursor-pointer"
                                            >
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-primary/5 rounded-2xl -m-0.5 border-2 border-primary/40 ring-4 ring-primary/5"></div>
                                                )}
                                                <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6 transition-transform">
                                                    <div className={`size-14 shrink-0 rounded-2xl flex flex-col items-center justify-center shadow-lg ${result.is_passed ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                                                        <span className="text-[10px] font-black uppercase">{month}</span>
                                                        <span className="text-xl font-black">{date}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 ${result.is_passed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600'} text-[10px] font-bold rounded-full uppercase`}>
                                                                {result.is_passed ? 'Passed' : 'Failed'} • {Math.round(result.score_percent)}%
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{result.exam.subject?.name || 'General'}</span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{result.exam.title}</h4>
                                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {time}</span>
                                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">military_tech</span> Score: {result.final_score}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-slate-300'}`}>chevron_right</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right side: Result Detail */}
            <motion.div
                initial={false}
                animate={{
                    width: selectedResult || isLoading ? 450 : 0,
                    opacity: selectedResult || isLoading ? 1 : 0,
                    marginLeft: selectedResult || isLoading ? 32 : 0
                }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="flex flex-col h-full overflow-hidden"
            >
                <div className="w-[450px] flex flex-col h-full">
                    <div className="px-2 mb-4 flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Result Detail</h3>
                        <button
                            onClick={() => setSelectedResult(null)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="skeleton-right"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6"
                            >
                                <div className="space-y-4">
                                    <Skeleton className="size-14 rounded-2xl" />
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-32 w-full rounded-2xl" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                            </motion.div>
                        ) : selectedResult ? (
                            <motion.div
                                key={selectedResult.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
                            >
                                <div className="overflow-y-auto custom-scrollbar flex flex-col h-full">
                                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`size-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedResult.is_passed ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                                                <span className="material-symbols-outlined text-2xl">{selectedResult.is_passed ? 'verified' : 'error'}</span>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${selectedResult.is_passed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600'}`}>
                                                {selectedResult.is_passed ? 'PASSED' : 'FAILED'}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">{selectedResult.exam.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wide">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {formatDate(selectedResult.finished_at).full}</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">timer</span> {selectedResult.exam.duration}m</span>
                                        </div>

                                        <div className="mt-8 grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedResult.final_score}</p>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(selectedResult.score_percent)}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        <div className="group">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Analysis</span>
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-blue-500 text-lg">subject</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Subject</p>
                                                        <p className="text-[11px] text-slate-500">{selectedResult.exam.subject?.name || 'General'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-amber-500 text-lg">history</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Completed At</p>
                                                        <p className="text-[11px] text-slate-500">{formatDate(selectedResult.finished_at).time} - {formatDate(selectedResult.finished_at).full}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="size-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-purple-500 text-lg">category</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Exam Type</p>
                                                        <p className="text-[11px] text-slate-500">{selectedResult.exam.type_label}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedResult.exam.is_show_result && (
                                        <div className="mt-auto p-8 pt-4">
                                            <Link
                                                to={`/exams/history/${selectedResult.exam_id}/${selectedResult.exam_session_id}`}
                                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                                <span>View Detailed Submissions</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history_edu</span>
                                <p className="text-sm font-medium">Select an exam to view detailed results</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
