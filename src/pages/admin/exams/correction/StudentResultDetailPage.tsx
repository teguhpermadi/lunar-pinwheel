import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { examApi, Exam } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';
import { StudentSession, QuestionDetail } from '@/pages/admin/exams/ExamCorrectionPage';

const StudentResultDetailPage: React.FC = () => {
    const { id: examId, sessionId } = useParams<{ id: string; sessionId: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]);
    const [sessionInfo, setSessionInfo] = useState<StudentSession | null>(null);
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');

    // Collapsible states
    const [expandedSections, setExpandedSections] = useState({
        candidate: true,
        insight: true,
        targeting: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
    };

    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    useEffect(() => {
        if (examId && sessionId) {
            fetchDetail();
        }
    }, [examId, sessionId]);

    const fetchDetail = async () => {
        if (!examId || !sessionId) return;
        setIsLoading(true);
        try {
            const response = await examApi.getCorrectionDetail(examId, sessionId);
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
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header / Breadcrumbs */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 w-full overflow-x-auto no-scrollbar py-1">
                        <Link to={isStudent ? "/exams/history" : `/admin/exams/${examId}/correction`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
                            <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] sm:text-sm whitespace-nowrap">
                            <span className="text-slate-400">{isStudent ? 'History' : 'Exams'}</span>
                            <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-300">chevron_right</span>
                            {!isStudent && (
                                <>
                                    <span className="text-slate-400">Correction</span>
                                    <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-300">chevron_right</span>
                                </>
                            )}
                            <span className="font-bold text-primary">Result Detail</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Post-Exam Deep Dive</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 font-medium text-xs sm:text-base italic sm:not-italic">Review response for <span className="text-slate-900 dark:text-slate-200 font-bold">{sessionInfo?.student.name}</span> in <span className="text-slate-900 dark:text-slate-200 font-bold">{exam?.title}</span></p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
                        {/* Main Content (Left) */}
                        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                            {/* Score Card - Moved to Top */}
                            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card overflow-hidden group">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                    <div className="text-center sm:text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
                                        <h2 className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent-pink">
                                            {Math.round(sessionInfo?.final_score || 0)}%
                                        </h2>
                                    </div>
                                    <div className="size-20 sm:size-24 relative">
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
                                            <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary/30 group-hover:text-primary transition-colors">emoji_events</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto sm:min-w-[240px]">
                                        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-3 sm:p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex flex-col items-center sm:items-start">
                                            <p className="text-[8px] sm:text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider mb-1">Correct</p>
                                            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                                {questions.filter(q => q.is_correct === true).length}
                                            </p>
                                        </div>
                                        <div className="bg-rose-50/50 dark:bg-rose-500/5 p-3 sm:p-4 rounded-2xl border border-rose-100 dark:border-rose-500/10 flex flex-col items-center sm:items-start">
                                            <p className="text-[8px] sm:text-[9px] uppercase font-black text-rose-600 dark:text-rose-400 tracking-wider mb-1">Incorrect</p>
                                            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                                {questions.filter(q => q.is_correct === false).length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl sm:rounded-full border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-fit sticky top-[env(safe-area-inset-top,0)] sm:top-0 z-10 transition-all">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={cn(
                                        "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-black transition-all",
                                        filter === 'all' ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    )}
                                >
                                    All ({questions.length})
                                </button>
                                <button
                                    onClick={() => setFilter('incorrect')}
                                    className={cn(
                                        "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-black transition-all",
                                        filter === 'incorrect' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    )}
                                >
                                    Incorrect ({questions.filter(q => q.is_correct === false).length})
                                </button>
                                <button
                                    onClick={() => setFilter('flagged')}
                                    className={cn(
                                        "flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-black transition-all",
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
                                className="space-y-8 pb-10"
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
                                        <div className="p-5 sm:p-8">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <span className={cn(
                                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0",
                                                        q.is_correct === true ? "bg-emerald-100 text-emerald-600" :
                                                            q.is_correct === false ? "bg-rose-100 text-rose-600" :
                                                                "bg-amber-100 text-amber-600"
                                                    )}>
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </span>
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-lg">
                                                        {q.question_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                                                    <div className={cn(
                                                        "flex items-center gap-1 font-black text-[10px] sm:text-xs uppercase tracking-widest",
                                                        q.is_correct === true ? "text-emerald-500" :
                                                            q.is_correct === false ? "text-rose-500" : "text-amber-500"
                                                    )}>
                                                        <span className="material-symbols-outlined text-base sm:text-lg">
                                                            {q.is_correct === true ? 'check_circle' : q.is_correct === false ? 'cancel' : 'offline_pin'}
                                                        </span>
                                                        {q.is_correct === true ? 'Correct' : q.is_correct === false ? 'Incorrect' : 'Partial'}
                                                    </div>
                                                    <div className={cn(
                                                        "px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm border",
                                                        q.score_earned === q.max_score ? "bg-emerald-500 text-white border-emerald-400" :
                                                            q.score_earned > 0 ? "bg-amber-500 text-white border-amber-400" : "bg-rose-500 text-white border-rose-400"
                                                    )}>
                                                        <span className="material-symbols-outlined text-[12px] sm:text-[14px]">stars</span>
                                                        {q.score_earned} / {q.max_score}
                                                    </div>
                                                </div>
                                            </div>

                                            <MathRenderer className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-6 sm:mb-8 leading-relaxed" content={q.question_content} />

                                            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-x-auto">
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
                                        <div className="px-5 sm:px-8 py-4 sm:py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Points</span>
                                                <span className={cn(
                                                    "text-lg sm:text-xl font-black tabular-nums",
                                                    q.score_earned === q.max_score ? "text-emerald-500" :
                                                        q.score_earned > 0 ? "text-amber-500" : "text-rose-500"
                                                )}>
                                                    {q.score_earned} <span className="text-slate-300 font-bold text-xs sm:text-sm">/ {q.max_score}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {q.correction_notes && (
                                            <div className="p-6 sm:p-8 bg-primary/5 border-t border-primary/10 flex gap-3 sm:gap-4">
                                                <span className="material-symbols-outlined text-primary text-xl sm:text-2xl shrink-0">lightbulb</span>
                                                <div>
                                                    <h4 className="text-[10px] sm:text-xs font-black uppercase text-primary tracking-widest mb-1">Analytical Feedback</h4>
                                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic line-clamp-3">
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
                        <aside className="lg:col-span-4 space-y-6">
                            {/* Candidate & Exam Intelligence Section */}
                            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
                                {/* Segment 1: Candidate Detail */}
                                <div className="border-b border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => toggleSection('candidate')}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                <span className="material-symbols-outlined text-xl">person</span>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Candidate Detail</span>
                                        </div>
                                        <span className={cn(
                                            "material-symbols-outlined text-slate-400 transition-transform duration-300",
                                            expandedSections.candidate ? "rotate-180" : ""
                                        )}>keyboard_arrow_down</span>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections.candidate && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2 space-y-6">
                                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                            {sessionInfo?.student.avatar ? (
                                                                <img src={sessionInfo.student.avatar} alt={sessionInfo.student.name} className="size-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{sessionInfo?.student.name}</h4>
                                                            <p className="text-[10px] text-slate-400 font-medium truncate">{sessionInfo?.student.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="material-symbols-outlined text-primary text-lg">meeting_room</span>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1">Student Room</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                    {(sessionInfo?.student as any)?.classrooms?.[0]?.name || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Segment 2: Exam Insight */}
                                <div className="border-b border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => toggleSection('insight')}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-200 dark:border-indigo-500/20">
                                                <span className="material-symbols-outlined text-xl">psychology</span>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Exam Insight</span>
                                        </div>
                                        <span className={cn(
                                            "material-symbols-outlined text-slate-400 transition-transform duration-300",
                                            expandedSections.insight ? "rotate-180" : ""
                                        )}>keyboard_arrow_down</span>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections.insight && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2 space-y-6">
                                                    <div className="p-4 rounded-3xl bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10">
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{exam?.title}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-tight rounded-md border border-indigo-200 dark:border-indigo-500/20">
                                                                {exam?.type.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold">• {exam?.subject?.name}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Start Time</p>
                                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{formatDate(exam?.start_time)}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">End Time</p>
                                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{formatDate(exam?.end_time)}</p>
                                                        </div>
                                                        <div className="space-y-1 col-span-2">
                                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Exam Duration</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm text-primary">timer</span>
                                                                <span className="text-xs font-black text-slate-900 dark:text-white px-2 py-1 bg-primary/10 rounded-lg">{formatDuration(exam?.duration)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Segment 3: Target Rooms */}
                                <div>
                                    <button
                                        onClick={() => toggleSection('targeting')}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-accent-pink/10 flex items-center justify-center text-accent-pink border border-accent-pink/20">
                                                <span className="material-symbols-outlined text-xl">groups</span>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Target Groups</span>
                                        </div>
                                        <span className={cn(
                                            "material-symbols-outlined text-slate-400 transition-transform duration-300",
                                            expandedSections.targeting ? "rotate-180" : ""
                                        )}>keyboard_arrow_down</span>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSections.targeting && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {exam?.classrooms?.map(classroom => (
                                                            <span
                                                                key={classroom.id}
                                                                className="px-3 py-1.5 bg-accent-pink/5 text-accent-pink text-[10px] font-black uppercase tracking-wider rounded-xl border border-accent-pink/10"
                                                            >
                                                                {classroom.name}
                                                            </span>
                                                        )) || <span className="text-[10px] text-slate-400 italic">No specific groups assigned</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentResultDetailPage;
