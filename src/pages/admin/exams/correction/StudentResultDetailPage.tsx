import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import { StudentSession, QuestionDetail } from '@/pages/admin/exams/ExamCorrectionPage';

const StudentResultDetailPage: React.FC = () => {
    const { id: examId, sessionId } = useParams<{ id: string; sessionId: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]);
    const [sessionInfo, setSessionInfo] = useState<StudentSession | null>(null);
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');

    useEffect(() => {
        if (examId && sessionId) {
            fetchDetail();
        }
    }, [examId, sessionId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const response = await examApi.getCorrectionDetail(examId!, sessionId!);
            if (response.success) {
                const answersData = response.data.answers;
                const fetchedQuestions = Array.isArray(answersData) ? answersData : (answersData.data || []);
                setQuestions(fetchedQuestions);
                setExam(response.data.exam);
                setSessionInfo(response.data.session);
            }
        } catch (error) {
            console.error('Error fetching student result detail:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredQuestions = questions.filter(q => {
        if (filter === 'incorrect') return q.is_correct === false;
        // Flagged is not in data yet, so just return true for now if all
        return true;
    });


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 space-y-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-10 w-96" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            <Skeleton className="h-12 w-full rounded-full" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
                            ))}
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
                            <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to={`/admin/exams/${examId}/correction`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Exams</span>
                            <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
                            <span className="text-slate-400">Correction</span>
                            <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
                            <span className="font-bold text-primary">Student Detail</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Post-Exam Deep Dive</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Review response for <span className="text-slate-900 dark:text-slate-200 font-bold">{sessionInfo?.student.name}</span> in <span className="text-slate-900 dark:text-slate-200 font-bold">{exam?.title}</span></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm w-fit mb-8">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-xs font-black transition-all",
                                    filter === 'all' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                All Questions ({questions.length})
                            </button>
                            <button
                                onClick={() => setFilter('incorrect')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-xs font-black transition-all",
                                    filter === 'incorrect' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                Incorrect Only ({questions.filter(q => q.is_correct === false).length})
                            </button>
                            <button
                                onClick={() => setFilter('flagged')}
                                className={cn(
                                    "px-6 py-2 rounded-full text-xs font-black transition-all",
                                    filter === 'flagged' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                Flagged (0)
                            </button>
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >
                            {filteredQuestions.map((q, index) => (
                                <motion.div
                                    key={q.id}
                                    variants={itemVariants}
                                    className={cn(
                                        "bg-white dark:bg-slate-900 rounded-[2.5rem] border shadow-card overflow-hidden",
                                        q.is_correct === true ? "border-emerald-500/10" :
                                            q.is_correct === false ? "border-rose-500/10" :
                                                "border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <span className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg",
                                                    q.is_correct === true ? "bg-emerald-100 text-emerald-600" :
                                                        q.is_correct === false ? "bg-rose-100 text-rose-600" :
                                                            "bg-amber-100 text-amber-600"
                                                )}>
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-lg">
                                                    {q.question_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "flex items-center gap-1 font-black text-xs uppercase tracking-widest",
                                                    q.is_correct === true ? "text-emerald-500" :
                                                        q.is_correct === false ? "text-rose-500" : "text-amber-500"
                                                )}>
                                                    <span className="material-symbols-outlined text-lg">
                                                        {q.is_correct === true ? 'check_circle' : q.is_correct === false ? 'cancel' : 'offline_pin'}
                                                    </span>
                                                    {q.is_correct === true ? 'Correct' : q.is_correct === false ? 'Incorrect' : 'Partial'}
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm border",
                                                    q.score_earned === q.max_score ? "bg-emerald-500 text-white border-emerald-400" :
                                                        q.score_earned > 0 ? "bg-amber-500 text-white border-amber-400" : "bg-rose-500 text-white border-rose-400"
                                                )}>
                                                    <span className="material-symbols-outlined text-[14px]">stars</span>
                                                    {q.score_earned} / {q.max_score}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_content }} />

                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                            <CorrectionDisplay
                                                type={q.question_type}
                                                studentAnswer={q.student_answer}
                                                options={q.options || []}
                                                keyAnswer={q.key_answer}
                                                maxScore={q.max_score}
                                                scoreEarned={q.score_earned}
                                            />
                                        </div>
                                    </div>

                                    {/* Score & Note Footer */}
                                    <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Points Earned</span>
                                            <span className={cn(
                                                "text-xl font-black tabular-nums",
                                                q.score_earned === q.max_score ? "text-emerald-500" :
                                                    q.score_earned > 0 ? "text-amber-500" : "text-rose-500"
                                            )}>
                                                {q.score_earned} <span className="text-slate-300 font-bold text-sm">/ {q.max_score}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {q.correction_notes && (
                                        <div className="p-8 bg-primary/5 border-t border-primary/10 flex gap-4">
                                            <span className="material-symbols-outlined text-primary text-2xl shrink-0">lightbulb</span>
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-primary tracking-widest mb-1">Analytical Feedback</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-3">
                                                    "{q.correction_notes}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Sidebar (Right) */}
                    <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
                        {/* Score Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-card overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
                                    <h2 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent-pink">
                                        {Math.round(sessionInfo?.final_score || 0)}%
                                    </h2>
                                </div>
                                <div className="size-20 relative">
                                    <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle className="text-slate-100 dark:text-slate-800" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="10" />
                                        <circle
                                            className="text-primary transition-all duration-1000 ease-out"
                                            cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="10"
                                            strokeDasharray="263.89"
                                            strokeDashoffset={263.89 - (263.89 * (sessionInfo?.final_score || 0) / 100)}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary/30 group-hover:text-primary transition-colors">emoji_events</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-500/10">
                                    <p className="text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider leading-none mb-1">Correct</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                        {questions.filter(q => q.is_correct === true).length}
                                    </p>
                                </div>
                                <div className="bg-rose-50/50 dark:bg-rose-500/5 p-4 rounded-3xl border border-rose-100 dark:border-rose-500/10">
                                    <p className="text-[9px] uppercase font-black text-rose-600 dark:text-rose-400 tracking-wider leading-none mb-1">Incorrect</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                        {questions.filter(q => q.is_correct === false).length}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    Knowledge Performance
                                    <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-600 dark:text-slate-400">Conceptual Accuracy</span>
                                            <span className="text-indigo-500">82%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '82%' }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="bg-indigo-500 h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-600 dark:text-slate-400">Response Consistency</span>
                                            <span className="text-accent-pink">64%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '64%' }}
                                                transition={{ duration: 1, delay: 0.7 }}
                                                className="bg-accent-pink h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] text-slate-400 leading-relaxed italic font-medium">
                                    "Your response suggests a strong grasp of subject matter, though some complex scenarios show room for improvement. Focus on the analytical feedback below."
                                </p>
                            </div>
                        </div>

                        {/* Study Material - Placeholders as per code.html */}
                        <div className="bg-gradient-to-br from-primary/5 to-accent-pink/5 rounded-[2.5rem] p-8 border border-primary/10 relative overflow-hidden">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-lg">school</span>
                                </div>
                                Recommended Review
                            </h3>
                            <div className="space-y-4">
                                <a href="#" className="flex gap-4 p-3 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                                        <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop" className="size-full object-cover" alt="Study" />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">Exam Mastery Guide</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">12 min read • Article</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default StudentResultDetailPage;
