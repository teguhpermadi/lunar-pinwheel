import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';

interface StudentSession {
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
}

interface QuestionDetail {
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
    const [studentSearchQuery, setStudentSearchQuery] = useState(''); // Specifically for right navigation

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


    useEffect(() => {
        fetchSessions();
    }, [id]); // Only refetch if ID changes

    useEffect(() => {
        if (selectedSessionId) {
            fetchDetail(selectedSessionId);
        }
    }, [id, selectedSessionId, fetchDetail]);


    const handleUpdateCorrection = async (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string) => {
        const targetSessionId = sessionIdOverride || selectedSessionId;
        const currentQuestion = questions[selectedQuestionIndex];
        const targetDetailId = detailIdOverride || currentQuestion?.id;

        if (!targetSessionId || !targetDetailId) return;

        try {
            const response = await examApi.updateCorrection(targetSessionId, targetDetailId, {
                score_earned: score,
                is_correct: isCorrect,
                correction_notes: ''
            });

            if (response.success) {
                // Update local state
                const newQuestions = [...questions];
                const idx = newQuestions.findIndex(q => q.id === targetDetailId);
                if (idx !== -1) {
                    newQuestions[idx] = { ...newQuestions[idx], score_earned: response.data.score_earned, is_correct: response.data.is_correct };
                    setQuestions(newQuestions);
                }

                Swal.fire({
                    title: 'Saved',
                    icon: 'success',
                    timer: 800,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });

                if (!detailIdOverride && selectedQuestionIndex < questions.length - 1) {
                    setSelectedQuestionIndex(selectedQuestionIndex + 1);
                }

                fetchSessions();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update correction', 'error');
        }
    };

    const handleFinishCorrection = async () => {
        if (!selectedSessionId) return;

        const result = await Swal.fire({
            title: 'Finalize Correction?',
            text: 'This will mark the session as corrected and notify the student.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Finalize',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await examApi.finishCorrection(selectedSessionId);
                if (response.success) {
                    Swal.fire('Success', 'Correction finalized successfully!', 'success');
                    fetchSessions();
                }
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to finalize correction', 'error');
            }
        }
    };

    // Sub-renderers
    const renderSidebarLeft = () => (
        <aside className="w-[280px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0">
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
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold truncate">{session.student.name}</p>
                                        <p className="text-[9px] text-slate-400 uppercase font-black">{session.is_corrected ? 'Corrected' : 'Pending'}</p>
                                    </div>
                                </div>
                            </button>
                        ))
                )}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <button
                    onClick={handleFinishCorrection}
                    disabled={!selectedSessionId}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                    Finalize Session
                </button>
            </div>
        </aside>
    );

    const renderSidebarRight = () => (
        <aside className="w-[300px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0 relative">
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

    const currentQuestion = questions[selectedQuestionIndex];

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
                                {sessions.length} Students • {questions.length} Questions
                            </p>
                        </div>
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
                {renderSidebarLeft()}

                <section className="flex-grow bg-slate-50 dark:bg-background-dark/30 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-4xl mx-auto w-full space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${selectedSessionId}-${selectedQuestionIndex}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {isDetailLoading || !currentQuestion ? (
                                    <div className="space-y-6 animate-pulse">
                                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center gap-4 mb-6">
                                                <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                                    Question {(selectedQuestionIndex + 1).toString().padStart(2, '0')}
                                                </span>
                                                <div
                                                    className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed flex-1"
                                                    dangerouslySetInnerHTML={{ __html: currentQuestion.question_content }}
                                                />
                                            </div>

                                            <CorrectionDisplay
                                                type={currentQuestion.question_type}
                                                studentAnswer={currentQuestion.student_answer}
                                                options={currentQuestion.options || []}
                                                maxScore={currentQuestion.max_score}
                                                scoreEarned={currentQuestion.score_earned}
                                            />
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evaluate Response</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Max Score:</span>
                                                    <span className="text-sm font-black text-primary tabular-nums">{currentQuestion.max_score}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <button
                                                    onClick={() => handleUpdateCorrection(currentQuestion.max_score, true)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                                        currentQuestion.is_correct === true && currentQuestion.score_earned === currentQuestion.max_score
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">Full Marks</span>
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateCorrection(currentQuestion.max_score / 2, true)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                                        (currentQuestion.is_correct === true && currentQuestion.score_earned < currentQuestion.max_score && currentQuestion.score_earned > 0)
                                                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-amber-200 hover:bg-amber-50/50"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-2xl">adjust</span>
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">Partial</span>
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateCorrection(0, false)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                                        currentQuestion.is_correct === false
                                                            ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-rose-200 hover:bg-rose-50/50"
                                                    )}
                                                >
                                                    <span className="material-symbols-outlined text-2xl">cancel</span>
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">Incorrect</span>
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <textarea
                                                        className="w-full text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl focus:ring-primary focus:border-primary placeholder-slate-300 min-h-[100px] p-4 pt-8"
                                                        placeholder="Type feedback or evaluation notes..."
                                                        value={currentQuestion.correction_notes || ''}
                                                        onChange={(e) => {
                                                            const newQuestions = [...questions];
                                                            newQuestions[selectedQuestionIndex].correction_notes = e.target.value;
                                                            setQuestions(newQuestions);
                                                        }}
                                                    ></textarea>
                                                    <label className="absolute top-3 left-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Teacher's Comment</label>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Evaluation is autosaved on button click
                                                    </p>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1))}
                                                            disabled={selectedQuestionIndex === 0}
                                                            className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-30"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_left</span>
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedQuestionIndex(Math.min(questions.length - 1, selectedQuestionIndex + 1))}
                                                            disabled={selectedQuestionIndex === questions.length - 1}
                                                            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-30"
                                                        >
                                                            Next
                                                            <span className="material-symbols-outlined text-sm">keyboard_arrow_right</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </section>

                {renderSidebarRight()}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(127, 19, 236, 0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(127, 19, 236, 0.3); }
            `}</style>
        </div>
    );
}
