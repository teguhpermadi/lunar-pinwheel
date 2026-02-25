import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';
import CorrectionByStudent from './correction/CorrectionByStudent';
import CorrectionByQuestion from './correction/CorrectionByQuestion';
import CorrectionLeaderboard from './correction/CorrectionLeaderboard';

export const EXCLUDED_PARTIAL_TYPES = ['multiple_choice', 'true_false'];

export interface StudentSession {
    id: string;
    student: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    total_score: number;
    total_max_score: number;
    final_score: number;
    is_corrected: boolean;
    is_finished: boolean;
    progress_percent?: number;
    start_time?: string;
    finish_time?: string;
}

export interface QuestionDetail {
    id: string; // Detail ID
    question_type: string;
    question_content: string;
    student_answer: any;
    is_correct: boolean | null;
    score_earned: number;
    max_score: number;
    correction_notes: string | null;
    question_number: number;
    options?: any[];
    key_answer?: any;
}

export default function ExamCorrectionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<Exam | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]); // Details for selected session (By Student)
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState(''); // Specifically for right navigation

    const [viewMode, setViewMode] = useState<'by-student' | 'by-question' | 'leaderboard'>('by-student');
    const [masterQuestions, setMasterQuestions] = useState<any[]>([]); // All questions in the exam
    const [bulkAnswers, setBulkAnswers] = useState<any[]>([]); // Answers for a specific question across all students
    const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);

    // Partial Score Modal State
    const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
    const [partialScoreData, setPartialScoreData] = useState<{
        detailId?: string;
        sessionId?: string;
        maxScore: number;
        currentScore: number;
        studentName?: string;
    } | null>(null);

    const [isBulkPartialModalOpen, setIsBulkPartialModalOpen] = useState(false);
    const [bulkPartialScore, setBulkPartialScore] = useState(0);

    const fetchSessions = useCallback(async () => {
        if (!id) return;
        setIsSessionsLoading(true);
        try {
            const response = await examApi.getCorrectionSessions(id);
            if (response.success) {
                // Adjust to the new backend response structure
                if (response.data.sessions) {
                    setSessions(response.data.sessions);
                    setExam(response.data.exam);
                    if (response.data.questions) {
                        setMasterQuestions(response.data.questions);
                    }

                    // Auto select first session if none selected
                    if (!selectedSessionId && response.data.sessions.length > 0) {
                        setSelectedSessionId(response.data.sessions[0].id);
                    }
                } else {
                    // Fallback for old structure if necessary
                    setSessions(response.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsSessionsLoading(false);
            setIsLoading(false);
        }
    }, [id, selectedSessionId]);

    const fetchDetail = useCallback(async (sessionId: string) => {
        if (!id) return;
        setIsDetailLoading(true);
        try {
            const response = await examApi.getCorrectionDetail(id, sessionId);
            if (response.success) {
                const answersData = response.data.answers;
                const fetchedQuestions = Array.isArray(answersData) ? answersData : (answersData.data || []);
                setQuestions(fetchedQuestions);
                setExam(response.data.exam);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setIsDetailLoading(false);
        }
    }, [id]);

    const fetchByQuestion = useCallback(async (questionId: string) => {
        if (!id) return;
        setIsBulkLoading(true);
        try {
            const response = await examApi.getCorrectionByQuestion(id, questionId);
            if (response.success) {
                setBulkAnswers(response.data.answers || []);
            }
        } catch (error) {
            console.error('Error fetching bulk answers:', error);
        } finally {
            setIsBulkLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSessions();
    }, [id]); // Only refetch if ID changes

    useEffect(() => {
        if (viewMode === 'by-student' && selectedSessionId) {
            fetchDetail(selectedSessionId);
        } else if (viewMode === 'by-question' && masterQuestions.length > 0) {
            const currentQuestionId = masterQuestions[selectedQuestionIndex]?.id;
            if (currentQuestionId) {
                fetchByQuestion(currentQuestionId);
            }
        }
    }, [id, selectedSessionId, selectedQuestionIndex, viewMode, masterQuestions, fetchDetail, fetchByQuestion]);


    const handleUpdateCorrection = async (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string) => {
        const targetSessionId = sessionIdOverride || selectedSessionId;
        const currentQuestion = viewMode === 'by-student' ? questions[selectedQuestionIndex] : null;
        const targetDetailId = detailIdOverride || currentQuestion?.id;

        if (!targetSessionId || !targetDetailId) return;

        // Determine marking status
        let markingStatus: 'full' | 'partial' | 'no' = 'partial';
        const maxScore = detailIdOverride
            ? bulkAnswers.find(a => a.id === detailIdOverride)?.max_score
            : currentQuestion?.max_score;

        if (score === maxScore) markingStatus = 'full';
        else if (score === 0 && !isCorrect) markingStatus = 'no';

        try {
            const response = await examApi.updateCorrection(targetSessionId, targetDetailId, {
                marking_status: markingStatus,
                score_earned: markingStatus === 'partial' ? score : undefined,
                is_correct: isCorrect,
                correction_notes: ''
            });

            if (response.success) {
                // Update local student-based state if applicable
                if (viewMode === 'by-student') {
                    const newQuestions = [...questions];
                    const idx = newQuestions.findIndex(q => q.id === targetDetailId);
                    if (idx !== -1) {
                        newQuestions[idx] = { ...newQuestions[idx], score_earned: response.data.score_earned, is_correct: response.data.is_correct };
                        setQuestions(newQuestions);
                    }
                } else {
                    // Update bulk answers list
                    const newBulkAnswers = [...bulkAnswers];
                    const idx = newBulkAnswers.findIndex(a => a.id === targetDetailId);
                    if (idx !== -1) {
                        newBulkAnswers[idx] = {
                            ...newBulkAnswers[idx],
                            score_earned: response.data.score_earned,
                            is_correct: response.data.is_correct
                        };
                        setBulkAnswers(newBulkAnswers);
                    }
                }

                Swal.fire({
                    title: 'Saved',
                    icon: 'success',
                    timer: 800,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });

                if (!detailIdOverride && viewMode === 'by-student' && selectedQuestionIndex < questions.length - 1) {
                    setSelectedQuestionIndex(selectedQuestionIndex + 1);
                }

                fetchSessions();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update correction', 'error');
        }
    };

    const toggleAnswerSelection = (answerId: string) => {
        setSelectedAnswerIds(prev =>
            prev.includes(answerId)
                ? prev.filter(id => id !== answerId)
                : [...prev, answerId]
        );
    };

    const handleBulkAction = async (status: 'full' | 'no' | 'partial', score?: number) => {
        if (!id || selectedAnswerIds.length === 0) return;

        // Skip confirmation for partial as the modal has its own save button
        if (status !== 'partial') {
            const confirmData = {
                title: `Mark ${selectedAnswerIds.length} answers?`,
                text: status === 'full' ? 'All selected answers will get max score.' : 'All selected answers will get 0 score.',
                icon: 'warning' as const,
                showCancelButton: true,
                confirmButtonText: 'Yes, update all'
            };

            const result = await Swal.fire(confirmData);
            if (!result.isConfirmed) return;
        }

        setIsBulkLoading(true);
        try {
            const updates = selectedAnswerIds.map(detailId => ({
                id: detailId,
                marking_status: status,
                score_earned: status === 'partial' ? score : undefined
            }));

            const response = await examApi.bulkCorrection(id, updates as any);
            if (response.success) {
                Swal.fire({
                    title: 'Updated',
                    text: response.message,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                setSelectedAnswerIds([]);
                const currentQuestionId = masterQuestions[selectedQuestionIndex]?.id;
                if (currentQuestionId) {
                    fetchByQuestion(currentQuestionId);
                }
                fetchSessions();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update bulk correction', 'error');
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0) {
            setSelectedAnswerIds([]);
        } else {
            setSelectedAnswerIds(bulkAnswers.map(a => a.id));
        }
    };

    const handleFinishCorrection = async (sessionId?: string | string[]) => {
        const targetSessionIds = sessionId ? (Array.isArray(sessionId) ? sessionId : [sessionId]) : (selectedSessionId ? [selectedSessionId] : []);

        if (targetSessionIds.length === 0) return;

        const result = await Swal.fire({
            title: targetSessionIds.length > 1 ? 'Finalize Multiple Corrections?' : 'Finalize Correction?',
            text: targetSessionIds.length > 1
                ? `This will mark ${targetSessionIds.length} sessions as corrected and notify the students.`
                : 'This will mark the session as corrected and notify the student.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Finalize',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                // Bulk finalize sessions sequentially or via parallel (sequentially is safer if API is single-id)
                // Actually examApi.finishCorrection only takes one ID.
                for (const id of targetSessionIds) {
                    await examApi.finishCorrection(id);
                }

                Swal.fire('Success', targetSessionIds.length > 1 ? 'Corrections finalized successfully!' : 'Correction finalized successfully!', 'success');
                fetchSessions();
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to finalize correction', 'error');
            }
        }
    };

    // Sub-renderers
    const renderSidebarLeft = () => (
        <aside className="w-[280px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0">
            {viewMode === 'by-student' ? (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Students</h2>
                            <span className="text-[10px] font-bold text-slate-400">{sessions.length}</span>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                className="w-full pl-8 py-1.5 text-xs border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg outline-none"
                                placeholder="Search..."
                                value={studentSearchQuery}
                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {isSessionsLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 border-b border-slate-100 animate-pulse">
                                    <Skeleton className="h-8 w-full rounded" />
                                </div>
                            ))
                        ) : (
                            sessions
                                .filter(s => s.student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                .map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => setSelectedSessionId(session.id)}
                                        className={cn(
                                            "w-full p-4 border-b border-slate-100 dark:border-slate-800 text-left transition-all",
                                            selectedSessionId === session.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                                                {session.student.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 overflow-hidden flex items-center justify-between gap-2">
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold truncate">{session.student.name}</p>
                                                    <p className="text-[9px] text-slate-400 uppercase font-black">{session.is_corrected ? 'Corrected' : 'Pending'}</p>
                                                </div>
                                                {session.is_finished && (
                                                    <span className="shrink-0 px-2.5 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg border border-primary/20 tabular-nums">
                                                        {session.final_score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                        )}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <button
                            onClick={() => handleFinishCorrection()}
                            disabled={!selectedSessionId}
                            className="w-full py-3 bg-primary hover:bg-primary-dark text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                            Finalize Session
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Questions</h2>
                        <span className="text-[9px] font-black text-slate-400 uppercase block mt-1 tracking-widest">Fixed List</span>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {masterQuestions.map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestionIndex(index)}
                                className={cn(
                                    "w-full p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-left transition-all",
                                    selectedQuestionIndex === index ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50"
                                )}
                            >
                                <span className={cn(
                                    "flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center",
                                    selectedQuestionIndex === index ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="flex-grow overflow-hidden">
                                    <p className={cn(
                                        "text-xs truncate",
                                        selectedQuestionIndex === index ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500"
                                    )}>
                                        {(q.content || q.question_content || '').replace(/<[^>]*>/g, '') || `Question ${index + 1}`}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                                        Type: {(q.question_type || '').replace('_', ' ')}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </aside>
    );

    const scrollToAnswer = (sessionId: string) => {
        const element = document.getElementById(`session-${sessionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const renderSidebarRight = () => (
        <aside className="w-[300px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0 relative">
            {viewMode === 'by-student' ? (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</h2>
                        <span className="text-[9px] font-black text-slate-400 uppercase block mt-1 tracking-widest">Question List</span>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {questions.map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestionIndex(index)}
                                className={cn(
                                    "w-full p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-left transition-all",
                                    selectedQuestionIndex === index ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50"
                                )}
                            >
                                <span className={cn(
                                    "flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center",
                                    q.is_correct === true ? "bg-emerald-100 text-emerald-600" :
                                        q.is_correct === false ? "bg-rose-100 text-rose-600" :
                                            "bg-slate-100 text-slate-400"
                                )}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Question {index + 1}</p>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Navigation</h2>
                        <div className="mt-3 relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                className="w-full pl-8 py-1.5 text-xs border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg outline-none"
                                placeholder="Find Student..."
                                value={studentSearchQuery}
                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {isSessionsLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full mb-1" />
                            ))
                        ) : (
                            sessions
                                .filter(s => s.student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                .map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => scrollToAnswer(session.id)}
                                        className={cn(
                                            "w-full p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-left transition-all hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 text-left flex-1 overflow-hidden">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full shrink-0",
                                                session.is_corrected ? "bg-emerald-500" : "bg-slate-200"
                                            )}></div>
                                            <p className="text-xs font-medium text-slate-500 truncate flex-1">{session.student.name}</p>
                                            {session.is_finished && (
                                                <span className="shrink-0 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md border border-indigo-100 dark:border-indigo-500/20 tabular-nums">
                                                    {session.final_score}
                                                </span>
                                            )}
                                        </div>
                                        {session.is_corrected && (
                                            <span className="material-symbols-outlined text-emerald-500 text-sm shrink-0 ml-2">check_circle</span>
                                        )}
                                    </button>
                                ))
                        )}
                    </div>
                </>
            )}
        </aside>
    );

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Correction Data...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = viewMode === 'by-student'
        ? questions[selectedQuestionIndex]
        : masterQuestions[selectedQuestionIndex];

    const currentQuestionContent = viewMode === 'by-student'
        ? currentQuestion?.question_content
        : currentQuestion?.content || currentQuestion?.question_content || '';

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark font-lexend">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 shadow-sm z-10">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/exams')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{exam?.title || 'Exam Correction'}</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {sessions.length} Students • {masterQuestions.length || questions.length} Questions
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => {
                                setViewMode('leaderboard');
                            }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                viewMode === 'leaderboard' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                            )}
                        >
                            Leaderboard
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('by-student');
                                setSelectedQuestionIndex(0);
                            }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                viewMode === 'by-student' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                            )}
                        >
                            By Student
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('by-question');
                                setSelectedQuestionIndex(0);
                            }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                viewMode === 'by-question' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                            )}
                        >
                            By Question
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                            <p className="text-xs font-bold text-emerald-500 uppercase">Live Correction</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex overflow-hidden">
                {viewMode !== 'leaderboard' && renderSidebarLeft()}

                <section className={cn(
                    "flex-grow bg-slate-50 dark:bg-background-dark/30 overflow-y-auto custom-scrollbar p-8 transition-all duration-300",
                    viewMode === 'leaderboard' && "max-w-[1600px] mx-auto w-full px-12"
                )}>
                    <div className={cn(
                        "mx-auto w-full space-y-6",
                        viewMode === 'leaderboard' ? "max-w-none" : "max-w-4xl"
                    )}>
                        <AnimatePresence mode="wait">
                            {viewMode === 'by-student' ? (
                                <CorrectionByStudent
                                    currentQuestion={currentQuestion}
                                    isDetailLoading={isDetailLoading}
                                    selectedQuestionIndex={selectedQuestionIndex}
                                    setSelectedQuestionIndex={setSelectedQuestionIndex}
                                    handleUpdateCorrection={handleUpdateCorrection}
                                    setPartialScoreData={setPartialScoreData}
                                    setIsPartialModalOpen={setIsPartialModalOpen}
                                    questions={questions}
                                    sessions={sessions}
                                    selectedSessionId={selectedSessionId}
                                    setQuestions={setQuestions}
                                />
                            ) : viewMode === 'by-question' ? (
                                <CorrectionByQuestion
                                    selectedQuestionIndex={selectedQuestionIndex}
                                    masterQuestions={masterQuestions}
                                    currentQuestionContent={currentQuestionContent}
                                    handleToggleSelectAll={handleToggleSelectAll}
                                    selectedAnswerIds={selectedAnswerIds}
                                    bulkAnswers={bulkAnswers}
                                    setSelectedQuestionIndex={setSelectedQuestionIndex}
                                    isBulkLoading={isBulkLoading}
                                    toggleAnswerSelection={toggleAnswerSelection}
                                    handleUpdateCorrection={handleUpdateCorrection}
                                    setPartialScoreData={setPartialScoreData}
                                    setIsPartialModalOpen={setIsPartialModalOpen}
                                />
                            ) : (
                                <CorrectionLeaderboard
                                    sessions={sessions}
                                    searchQuery={studentSearchQuery}
                                    onRefresh={fetchSessions}
                                    id={id!}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {viewMode !== 'leaderboard' && renderSidebarRight()}
            </main>

            {/* Bulk Action Bar */}
            {selectedAnswerIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-[40px] shadow-2xl flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marking</span>
                            <span className="text-white font-black text-sm">{selectedAnswerIds.length} Students Selected</span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('full')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                <span className="text-xs font-black uppercase tracking-wider">Mark as Correct</span>
                            </button>
                            {!EXCLUDED_PARTIAL_TYPES.includes(masterQuestions[selectedQuestionIndex]?.question_type) && (
                                <button
                                    onClick={() => {
                                        const firstBulk = bulkAnswers[0];
                                        setBulkPartialScore(firstBulk?.score_earned || 0);
                                        setIsBulkPartialModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-lg">adjust</span>
                                    <span className="text-xs font-black uppercase tracking-wider">Partial Score</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleFinishCorrection(
                                    bulkAnswers
                                        .filter(a => selectedAnswerIds.includes(a.id))
                                        .map(a => a.session.id)
                                )}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">verified</span>
                                <span className="text-xs font-black uppercase tracking-wider">Finalize Sessions</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('no')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">cancel</span>
                                <span className="text-xs font-black uppercase tracking-wider">Mark as Incorrect</span>
                            </button>
                            <button
                                onClick={() => setSelectedAnswerIds([])}
                                className="p-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Partial Score Modal */}
            <AnimatePresence>
                {isPartialModalOpen && partialScoreData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <span className="material-symbols-outlined">adjust</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Partial Score</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{partialScoreData.studentName || 'Student Response'}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Score</span>
                                            <span className="text-xs font-bold text-primary">Max: {partialScoreData.maxScore}</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {partialScoreData.maxScore === 1 ? (
                                                [0, 0.5, 1].map((score) => (
                                                    <button
                                                        key={score}
                                                        onClick={() => setPartialScoreData({ ...partialScoreData, currentScore: score })}
                                                        className={cn(
                                                            "py-4 rounded-xl border-2 font-black text-sm transition-all animate-in fade-in zoom-in duration-300",
                                                            partialScoreData.currentScore === score
                                                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary/30"
                                                        )}
                                                    >
                                                        {score}
                                                    </button>
                                                ))
                                            ) : (
                                                Array.from({ length: Math.floor(partialScoreData.maxScore) + 1 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setPartialScoreData({ ...partialScoreData, currentScore: i })}
                                                        className={cn(
                                                            "py-3 rounded-xl border-2 font-black text-sm transition-all animate-in fade-in zoom-in duration-300",
                                                            partialScoreData.currentScore === i
                                                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary/30"
                                                        )}
                                                    >
                                                        {i}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsPartialModalOpen(false)}
                                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                const finalScore = partialScoreData.currentScore;
                                                handleUpdateCorrection(finalScore, true, partialScoreData.detailId, partialScoreData.sessionId);
                                                setIsPartialModalOpen(false);
                                            }}
                                            className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
                                        >
                                            Save Score
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Partial Score Modal */}
            <AnimatePresence>
                {isBulkPartialModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <span className="material-symbols-outlined">adjust</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Bulk Partial Score</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Apply to {selectedAnswerIds.length} Students</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Score</span>
                                            <span className="text-xs font-bold text-primary">Max: {bulkAnswers[0]?.max_score}</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {bulkAnswers[0]?.max_score === 1 ? (
                                                [0, 0.5, 1].map((score) => (
                                                    <button
                                                        key={score}
                                                        onClick={() => setBulkPartialScore(score)}
                                                        className={cn(
                                                            "py-4 rounded-xl border-2 font-black text-sm transition-all animate-in fade-in zoom-in duration-300",
                                                            bulkPartialScore === score
                                                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary/30"
                                                        )}
                                                    >
                                                        {score}
                                                    </button>
                                                ))
                                            ) : (
                                                Array.from({ length: Math.floor(bulkAnswers[0]?.max_score) + 1 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setBulkPartialScore(i)}
                                                        className={cn(
                                                            "py-3 rounded-xl border-2 font-black text-sm transition-all animate-in fade-in zoom-in duration-300",
                                                            bulkPartialScore === i
                                                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-primary/30"
                                                        )}
                                                    >
                                                        {i}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsBulkPartialModalOpen(false)}
                                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                const finalScore = bulkPartialScore;
                                                handleBulkAction('partial', finalScore);
                                                setIsBulkPartialModalOpen(false);
                                            }}
                                            className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
                                        >
                                            Apply to All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(127, 19, 236, 0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(127, 19, 236, 0.3); }
            `}</style>
        </div>
    );
}
