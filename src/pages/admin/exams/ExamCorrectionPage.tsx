import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    Search,
    CheckCircle2,
    ArrowLeft,
    UserSearch,
    List,
    Filter,
    ChevronDown,
    Check,
    ShieldCheck,
    XCircle,
    MinusCircle,
    RefreshCw,
    Circle,
    AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import CorrectionByStudent from './correction/CorrectionByStudent';
import CorrectionByQuestion from './correction/CorrectionByQuestion';
import CorrectionLeaderboard from './correction/CorrectionLeaderboard';
import ItemAnalysisTab from './correction/ItemAnalysisTab';
import ExamQuestionManagement from './correction/ExamQuestionManagement';

export const EXCLUDED_PARTIAL_TYPES = ['multiple_choice', 'true_false'];
export const NEEDS_DOUBLE_CORRECTION_TYPES = ['short_answer', 'essay', 'math_input', 'arabic_input', 'javanese_input'];

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
    attempt_number?: number;
    total_attempts?: number;
    is_latest_attempt?: boolean;
}

export interface QuestionDetail {
    id: string; // Detail ID
    exam_session_id: string;
    exam_question_id: string;
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
    tags?: string[];
}

export interface QuestionCorrectionStatus {
    id: string;
    exam_id: string;
    exam_question_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_to_correct: number;
    corrected_count: number;
    last_error: string | null;
}

export default function ExamCorrectionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [exam, setExam] = useState<Exam | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]); // Details for selected session (By Student)
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

    const [isAttemptDropdownOpen, setIsAttemptDropdownOpen] = useState(false);
    const attemptDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attemptDropdownRef.current && !attemptDropdownRef.current.contains(event.target as Node)) {
                setIsAttemptDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [isLoading, setIsLoading] = useState(true);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState(''); // Specifically for right navigation

    const [attemptFilter, setAttemptFilter] = useState<string>('latest');
    const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
    const hasShownAttemptModal = useRef(false);

    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    const [viewMode, setViewMode] = useState<'by-student' | 'by-question' | 'leaderboard' | 'item-analysis' | 'manage-questions'>('leaderboard');
    const [masterQuestions, setMasterQuestions] = useState<any[]>([]); // All questions in the exam
    const [correctionStatuses, setCorrectionStatuses] = useState<QuestionCorrectionStatus[]>([]);
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

    const filteredSessions = useMemo(() => {
        if (attemptFilter === 'all') return sessions;
        if (attemptFilter === 'latest') return sessions.filter(s => s.is_latest_attempt);
        const attemptNum = parseInt(attemptFilter);
        if (!isNaN(attemptNum)) {
            return sessions.filter(s => s.attempt_number === attemptNum);
        }
        return sessions;
    }, [sessions, attemptFilter]);

    useEffect(() => {
        if (filteredSessions.length > 0 && selectedSessionId) {
            const exists = filteredSessions.find(s => s.id === selectedSessionId);
            if (!exists) {
                setSelectedSessionId(filteredSessions[0].id);
            }
        } else if (filteredSessions.length > 0 && !selectedSessionId) {
            setSelectedSessionId(filteredSessions[0].id);
        }
    }, [filteredSessions, selectedSessionId]);

    const filteredBulkAnswers = useMemo(() => {
        return bulkAnswers.filter(answer => {
            return filteredSessions.some(session => session.id === answer.exam_session_id);
        }).map(answer => {
            const sessionData = filteredSessions.find(s => s.id === answer.exam_session_id);
            return {
                ...answer,
                session: {
                    ...answer.session,
                    attempt_number: sessionData?.attempt_number,
                    total_attempts: sessionData?.total_attempts,
                    start_time: sessionData?.start_time,
                }
            };
        });
    }, [bulkAnswers, filteredSessions]);

    const uniqueAttempts = useMemo(() => {
        return [...new Set(sessions.map(s => s.attempt_number))].filter(Boolean).sort() as number[];
    }, [sessions]);

    const fetchSessions = useCallback(async () => {
        if (!id) return;
        setIsSessionsLoading(true);
        try {
            const response = await examApi.getCorrectionSessions(id);
            if (response.success) {
                // Adjust to the new backend response structure
                let rawSessions = response.data.sessions || response.data || [];

                // Process attempts
                const studentMap = new Map<string, StudentSession[]>();
                rawSessions.forEach((s: StudentSession) => {
                    const studentId = s.student.id;
                    if (!studentMap.has(studentId)) {
                        studentMap.set(studentId, []);
                    }
                    studentMap.get(studentId)!.push(s);
                });

                let processedSessions: StudentSession[] = [];
                let hasMultipleAttempts = false;

                studentMap.forEach((studentSessions) => {
                    // Sort by start_time ascending
                    studentSessions.sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime());

                    if (studentSessions.length > 1) hasMultipleAttempts = true;

                    studentSessions.forEach((s, index) => {
                        s.attempt_number = index + 1;
                        s.total_attempts = studentSessions.length;
                        s.is_latest_attempt = index === studentSessions.length - 1;
                        processedSessions.push(s);
                    });
                });

                // Sort somewhat nicely: name then attempt
                processedSessions.sort((a, b) => {
                    const nameCompare = a.student.name.localeCompare(b.student.name);
                    if (nameCompare !== 0) return nameCompare;
                    return (a.attempt_number || 1) - (b.attempt_number || 1);
                });

                setSessions(processedSessions);

                // Trigger modal on first load if there are multiple attempts
                // Trigger modal on first load if there are multiple attempts
                if (!hasShownAttemptModal.current && hasMultipleAttempts) {
                    setIsAttemptModalOpen(true);
                    hasShownAttemptModal.current = true;
                }

                if (response.data.exam) {
                    setExam(response.data.exam);
                }
                if (response.data.questions) {
                    setMasterQuestions(response.data.questions);
                }
                if (response.data.correction_statuses) {
                    setCorrectionStatuses(response.data.correction_statuses);
                }

                // Auto select first session based on current filter later, but for now just fallback
                if (!selectedSessionId && processedSessions.length > 0) {
                    // We'll update the selected session when filtering changes if needed
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
        if (selectedSessionId) {
            fetchDetail(selectedSessionId);
        }
    }, [id, selectedSessionId, fetchDetail]);

    useEffect(() => {
        if (viewMode === 'by-question' && masterQuestions.length > 0) {
            const currentQuestionId = masterQuestions[selectedQuestionIndex]?.id;
            if (currentQuestionId) {
                fetchByQuestion(currentQuestionId);
            }
        }
    }, [id, selectedQuestionIndex, viewMode, masterQuestions, fetchByQuestion]);

    useEffect(() => {
        if (!id || !(window as any).Echo) return;

        const channel = (window as any).Echo.channel(`exam.${id}.ai-correction`);
        channel.listen('.AiScoreUpdated', (e: any) => {
            console.log('AI Score Updated:', e);
            // Refresh sessions to get updated correction_statuses and session scores
            fetchSessions();
            if (viewMode === 'by-student' && selectedSessionId) {
                fetchDetail(selectedSessionId);
            } else if (viewMode === 'by-question' && masterQuestions.length > 0) {
                const currentQuestionId = masterQuestions[selectedQuestionIndex]?.id;
                if (currentQuestionId) {
                    fetchByQuestion(currentQuestionId);
                }
            }
        });

        return () => {
            (window as any).Echo.leave(`exam.${id}.ai-correction`);
        };
    }, [id, viewMode, selectedSessionId, selectedQuestionIndex, masterQuestions, fetchSessions, fetchDetail, fetchByQuestion]);

    const handleAiCorrect = async (params: { exam_question_id?: string, exam_session_id?: string }) => {
        if (!id) return;
        try {
            const response = await examApi.aiCorrect(id, { ...params, provider: 'openrouter' });
            if (response.success) {
                if (response.data.correction_statuses) {
                    setCorrectionStatuses(response.data.correction_statuses);
                }
                Swal.fire({
                    title: 'Started',
                    text: response.message,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to trigger AI correction', 'error');
        }
    };


    const handleUpdateCorrection = async (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string, notes?: string) => {
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

        // Use passed notes or existing notes from state
        let finalNotes = notes;
        if (finalNotes === undefined) {
            if (viewMode === 'by-student') {
                finalNotes = currentQuestion?.correction_notes || '';
            } else {
                finalNotes = bulkAnswers.find(a => a.id === targetDetailId)?.correction_notes || '';
            }
        }

        try {
            const response = await examApi.updateCorrection(targetSessionId, targetDetailId, {
                marking_status: markingStatus,
                score_earned: markingStatus === 'partial' ? score : undefined,
                is_correct: isCorrect,
                correction_notes: finalNotes
            });

            if (response.success) {
                // Update local student-based state if applicable
                if (viewMode === 'by-student') {
                    const newQuestions = [...questions];
                    const idx = newQuestions.findIndex(q => q.id === targetDetailId);
                    if (idx !== -1) {
                        newQuestions[idx] = { 
                            ...newQuestions[idx], 
                            score_earned: response.data.score_earned, 
                            is_correct: response.data.is_correct,
                            correction_notes: response.data.correction_notes
                        };
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
                            is_correct: response.data.is_correct,
                            correction_notes: response.data.correction_notes
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
        if (selectedAnswerIds.length === filteredBulkAnswers.length && filteredBulkAnswers.length > 0) {
            setSelectedAnswerIds([]);
        } else {
            setSelectedAnswerIds(filteredBulkAnswers.map(a => a.id));
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
        <>
            {/* Mobile Backdrop */}
            {isLeftSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsLeftSidebarOpen(false)}
                />
            )}
            <aside className={cn(
                "w-[280px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 z-50 lg:z-10",
                "fixed lg:static h-full lg:h-auto",
                isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {viewMode === 'by-student' ? (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Students</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400">{filteredSessions.length}</span>
                                    <button onClick={() => setIsLeftSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        className="w-full pl-8 py-1.5 text-xs border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg outline-none"
                                        placeholder="Search..."
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    />
                                </div>
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
                                filteredSessions
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
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <p className="text-[9px] text-slate-400 uppercase font-black">{session.is_corrected ? 'Corrected' : 'Pending'}</p>
                                                            {(session.total_attempts || 1) > 1 && (
                                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] rounded font-bold text-slate-500 truncate">
                                                                    Upaya {session.attempt_number} / {session.total_attempts}
                                                                </span>
                                                            )}
                                                        </div>
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
                            
                            {/* Correction Status Legend */}
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Done</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-pulse flex items-center justify-center">
                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">AI Progress</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 flex items-center justify-center">
                                        <AlertCircle className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Partial</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {masterQuestions.map((q, index) => (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        setSelectedQuestionIndex(index);
                                        if (viewMode === 'item-analysis') {
                                            const element = document.getElementById(`analysis-question-${q.id}`);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "w-full p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-left transition-all",
                                        selectedQuestionIndex === index ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn(
                                        "flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-colors",
                                        (() => {
                                            const detail = questions.find(qd => (qd as any).exam_question_id === q.id || (qd as any).exam_question?.id === q.id);
                                            if (selectedQuestionIndex === index) return "bg-primary text-white";
                                            if (!detail) return "bg-slate-100 text-slate-400";
                                            if (detail.is_correct === true && detail.score_earned === detail.max_score) return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
                                            if (detail.is_correct === true && detail.score_earned > 0) return "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400";
                                            if (detail.is_correct === false) return "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400";
                                            return "bg-slate-100 text-slate-400";
                                        })()
                                    )}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    <div className="flex-grow overflow-hidden text-left flex flex-col items-start gap-0.5">
                                        <div className="flex items-center gap-2 w-full overflow-hidden">
                                            <p
                                                className={cn(
                                                    "text-xs truncate flex-1",
                                                    selectedQuestionIndex === index ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500"
                                                )}
                                                dangerouslySetInnerHTML={{ __html: (q.content || q.question_content || '').replace(/<[^>]*>/g, '') || `Question ${index + 1}` }}
                                            />
                                            {(() => {
                                                const status = correctionStatuses.find(s => s.exam_question_id === q.id);
                                                if (status?.status === 'processing') return (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse shrink-0">
                                                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                        <span className="text-[8px] font-black uppercase">AI</span>
                                                    </div>
                                                );
                                                if (status?.status === 'completed' || (status && status.total_to_correct > 0 && status.corrected_count >= status.total_to_correct)) return (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[8px] font-black uppercase">Done</span>
                                                    </div>
                                                );
                                                if (NEEDS_DOUBLE_CORRECTION_TYPES.includes(q.question_type)) {
                                                    const isPartiallyCorrectedCount = (status?.corrected_count ?? 0);
                                                    const totalToCorrect = (status?.total_to_correct ?? 0);
                                                    return isPartiallyCorrectedCount > 0 
                                                        ? (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 shrink-0" title={`${isPartiallyCorrectedCount}/${totalToCorrect} Corrected`}>
                                                                <AlertCircle className="w-3 h-3" />
                                                                <span className="text-[8px] font-black uppercase">Partial</span>
                                                            </div>
                                                        )
                                                        : (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                                                                <Circle className="w-2.5 h-2.5" />
                                                                <span className="text-[8px] font-black uppercase">Pending</span>
                                                            </div>
                                                        );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                Type: {(q.question_type || '').replace('_', ' ')}
                                            </p>
                                            {(() => {
                                                const status = correctionStatuses.find(s => s.exam_question_id === q.id);
                                                if (status && status.total_to_correct > 0) {
                                                    return (
                                                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                                            {status.corrected_count}/{status.total_to_correct}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </aside>
        </>
    );

    const scrollToAnswer = (sessionId: string) => {
        const element = document.getElementById(`session-${sessionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const renderSidebarRight = () => (
        <>
            {/* Mobile Backdrop */}
            {isRightSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsRightSidebarOpen(false)}
                />
            )}
            <aside className={cn(
                "w-[300px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0 relative transition-all duration-300 z-50 lg:z-10",
                "fixed right-0 lg:static h-full lg:h-auto",
                isRightSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            )}>
                {viewMode === 'by-student' ? (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</h2>
                                <button onClick={() => setIsRightSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
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
                                        q.is_correct === true && q.score_earned === q.max_score ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                            q.is_correct === true && q.score_earned > 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                                                q.is_correct === false ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" :
                                                    "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                    )}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                        <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
                                            <p
                                                className={cn(
                                                    "text-xs truncate flex-1",
                                                    selectedQuestionIndex === index ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500"
                                                )}
                                                dangerouslySetInnerHTML={{ __html: (q.question_content || '').replace(/<[^>]*>/g, '') || `Question ${index + 1}` }}
                                            />
                                            {(() => {
                                                const status = correctionStatuses.find(s => s.exam_question_id === q.id);
                                                if (status?.status === 'processing') return (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg border border-blue-100 shrink-0 animate-pulse">
                                                        <RefreshCw className="w-2 h-2 animate-spin" />
                                                    </div>
                                                );
                                                if (status?.status === 'completed' || (status && status.total_to_correct > 0 && status.corrected_count >= status.total_to_correct)) return (
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                                );
                                                if (NEEDS_DOUBLE_CORRECTION_TYPES.includes(q.question_type)) {
                                                    const isPartiallyCorrectedCount = (status?.corrected_count ?? 0);
                                                    return isPartiallyCorrectedCount > 0 
                                                        ? <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                        : <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                Type: {(q.question_type || '').replace(/_/g, ' ')}
                                            </p>
                                            {(() => {
                                                const status = correctionStatuses.find(s => s.exam_question_id === q.id);
                                                if (status && status.total_to_correct > 0) {
                                                    return (
                                                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-1 rounded tabular-nums border border-slate-100 dark:border-slate-800">
                                                            {status.corrected_count}/{status.total_to_correct}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Navigation</h2>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        className="w-full pl-8 py-1.5 text-xs border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg outline-none"
                                        placeholder="Find Student..."
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {isSessionsLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full mb-1" />
                                ))
                            ) : (
                                filteredSessions
                                    .filter(s => s.student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                    .map((session) => {
                                        const answerForQuestion = viewMode === 'by-question'
                                            ? bulkAnswers.find(a => a.exam_session_id === session.id)
                                            : null;

                                        return (
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
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-xs font-medium text-slate-500 truncate">{session.student.name}</p>
                                                        {(session.total_attempts || 1) > 1 && (
                                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Upaya {session.attempt_number}</span>
                                                        )}
                                                    </div>
                                                    {viewMode === 'by-question' && answerForQuestion ? (
                                                        <span className={cn(
                                                            "shrink-0 px-2 flex items-center gap-1 py-0.5 text-[10px] font-black rounded-md border tabular-nums",
                                                            answerForQuestion.score_earned === answerForQuestion.max_score
                                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                                                : answerForQuestion.score_earned > 0
                                                                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                                                                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                                                        )}>
                                                            {answerForQuestion.score_earned} / {answerForQuestion.max_score}
                                                        </span>
                                                    ) : session.is_finished ? (
                                                        <span className="shrink-0 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md border border-indigo-100 dark:border-indigo-500/20 tabular-nums">
                                                            {session.final_score}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {session.is_corrected && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                                                )}
                                            </button>
                                        );
                                    })
                            )}
                        </div>
                    </>
                )}
            </aside>
        </>
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
        ? currentQuestion?.question_content || (currentQuestion as any)?.exam_question?.content
        : currentQuestion?.content || currentQuestion?.question_content || '';

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark font-lexend">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4 shrink-0 shadow-sm z-10">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/exams')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="hidden md:block">
                            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{exam?.title || 'Exam Correction'}</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {sessions.length} Students • {masterQuestions.length || questions.length} Questions
                            </p>
                        </div>
                        {/* Mobile sidebar triggers */}
                        {(viewMode === 'by-student' || viewMode === 'by-question' || viewMode === 'item-analysis') && (
                            <div className="flex lg:hidden gap-1">
                                <button
                                    onClick={() => setIsLeftSidebarOpen(true)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600"
                                >
                                    {viewMode === 'by-student' ? <UserSearch className="w-4.5 h-4.5" /> : <List className="w-4.5 h-4.5" />}
                                </button>
                                {(viewMode === 'by-student' || viewMode === 'by-question') && (
                                    <button
                                        onClick={() => setIsRightSidebarOpen(true)}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600"
                                    >
                                        {viewMode === 'by-student' ? <List className="w-4.5 h-4.5" /> : <UserSearch className="w-4.5 h-4.5" />}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl scale-90 sm:scale-100">
                            <button
                                onClick={() => {
                                    setViewMode('leaderboard');
                                    setSelectedQuestionIndex(0);
                                }}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all",
                                    viewMode === 'leaderboard' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                                )}
                            >
                                Leaderboard
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('by-student');
                                }}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all",
                                    viewMode === 'by-student' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                                )}
                            >
                                <span className="hidden sm:inline">By Student</span>
                                <span className="sm:hidden">Student</span>
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('by-question');
                                    setSelectedQuestionIndex(0);
                                }}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all",
                                    viewMode === 'by-question' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                                )}
                            >
                                <span className="hidden sm:inline">By Question</span>
                                <span className="sm:hidden">Question</span>
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('item-analysis');
                                }}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all",
                                    viewMode === 'item-analysis' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                                )}
                            >
                                Analysis
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('manage-questions');
                                    setSelectedQuestionIndex(0);
                                }}
                                className={cn(
                                    "px-2 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all",
                                    viewMode === 'manage-questions' ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-400"
                                )}
                            >
                                Manage
                            </button>
                        </div>
                        {uniqueAttempts.length > 0 && (
                            <div className="relative" ref={attemptDropdownRef}>
                                <button
                                    onClick={() => setIsAttemptDropdownOpen(!isAttemptDropdownOpen)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm transition-all",
                                        isAttemptDropdownOpen
                                            ? "bg-white dark:bg-slate-800 border-primary/30 ring-2 ring-primary/20 text-slate-900 dark:text-white"
                                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                    )}
                                >
                                    <Filter className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                        {attemptFilter === 'all' && 'Semua Upaya'}
                                        {attemptFilter === 'latest' && 'Upaya Terbaru'}
                                        {attemptFilter !== 'all' && attemptFilter !== 'latest' && `Upaya ke-${attemptFilter}`}
                                    </span>
                                    <ChevronDown className={cn(
                                        "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                                        isAttemptDropdownOpen ? "rotate-180" : ""
                                    )} />
                                </button>
                                <AnimatePresence>
                                    {isAttemptDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 origin-top"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        setAttemptFilter('all');
                                                        setIsAttemptDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between group",
                                                        attemptFilter === 'all'
                                                            ? "bg-primary/5 text-primary"
                                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    Semua Upaya
                                                    {attemptFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAttemptFilter('latest');
                                                        setIsAttemptDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between group",
                                                        attemptFilter === 'latest'
                                                            ? "bg-primary/5 text-primary"
                                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    Upaya Terbaru
                                                    {attemptFilter === 'latest' && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                {uniqueAttempts.map(num => (
                                                    <button
                                                        key={`opt-h-${num}`}
                                                        onClick={() => {
                                                            setAttemptFilter(num!.toString());
                                                            setIsAttemptDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between group",
                                                            attemptFilter === num!.toString()
                                                                ? "bg-primary/5 text-primary"
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                                        )}
                                                    >
                                                        Upaya ke-{num}
                                                        {attemptFilter === num!.toString() && <Check className="size-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => handleAiCorrect({})}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                AI Correct All
                            </button>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                            <p className="text-xs font-bold text-emerald-500 uppercase">Live Correction</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {(viewMode === 'by-student' || viewMode === 'by-question' || viewMode === 'item-analysis') && renderSidebarLeft()}

                <section className={cn(
                    "flex-grow bg-slate-50 dark:bg-background-dark/30 custom-scrollbar p-4 md:p-8 transition-all duration-300",
                    viewMode === 'manage-questions' ? "overflow-hidden h-full p-0 md:p-0 max-w-none" : "overflow-y-auto",
                    (viewMode === 'leaderboard' || viewMode === 'item-analysis') && "max-w-[1600px] mx-auto w-full px-4 md:px-12",
                )}>
                    <div className={cn(
                        "mx-auto w-full",
                        viewMode === 'manage-questions' ? "h-full space-y-0" : "space-y-6",
                        (viewMode === 'leaderboard' || viewMode === 'item-analysis' || viewMode === 'manage-questions') ? "max-w-none" : "max-w-4xl"
                    )}>
                        <AnimatePresence mode="wait">
                            {viewMode === 'by-student' ? (
                                <motion.div
                                    key="by-student"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
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
                                        isAdmin={user?.role === 'admin'}
                                        onAiCorrect={(sessionId, questionId) => handleAiCorrect({ exam_session_id: sessionId, exam_question_id: questionId })}
                                        onRefresh={() => {
                                            fetchSessions();
                                            if (selectedSessionId) fetchDetail(selectedSessionId);
                                        }}
                                    />
                                </motion.div>
                            ) : viewMode === 'by-question' ? (
                                <CorrectionByQuestion
                                    selectedQuestionIndex={selectedQuestionIndex}
                                    masterQuestions={masterQuestions}
                                    currentQuestionContent={currentQuestionContent}
                                    currentQuestionType={currentQuestion?.question_type}
                                    handleToggleSelectAll={handleToggleSelectAll}
                                    selectedAnswerIds={selectedAnswerIds}
                                    bulkAnswers={filteredBulkAnswers}
                                    setSelectedQuestionIndex={setSelectedQuestionIndex}
                                    isBulkLoading={isBulkLoading}
                                    toggleAnswerSelection={toggleAnswerSelection}
                                    handleUpdateCorrection={handleUpdateCorrection}
                                    setPartialScoreData={setPartialScoreData}
                                    setIsPartialModalOpen={setIsPartialModalOpen}
                                    isAdmin={user?.role === 'admin'}
                                    onAiCorrect={(questionId) => handleAiCorrect({ exam_question_id: questionId })}
                                    setBulkAnswers={setBulkAnswers}
                                    onRefresh={() => {
                                        fetchSessions();
                                        const currentQuestionId = masterQuestions[selectedQuestionIndex]?.id;
                                        if (currentQuestionId) fetchByQuestion(currentQuestionId);
                                    }}
                                />
                            ) : viewMode === 'item-analysis' ? (
                                <ItemAnalysisTab examId={id!} />
                            ) : viewMode === 'manage-questions' ? (
                                <ExamQuestionManagement
                                    examId={id!}
                                    questions={masterQuestions}
                                    onUpdate={fetchSessions}
                                />
                            ) : (
                                <CorrectionLeaderboard
                                    sessions={filteredSessions}
                                    searchQuery={studentSearchQuery}
                                    onRefresh={fetchSessions}
                                    id={id!}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {(viewMode === 'by-student' || viewMode === 'by-question') && renderSidebarRight()}
            </div>

            {/* Bulk Action Bar */}
            {selectedAnswerIds.length > 0 && (
                <div className="fixed bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300 w-[calc(100%-2rem)] sm:w-auto">
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-3xl sm:rounded-[40px] shadow-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Marking</span>
                            <span className="text-white font-black text-xs sm:text-sm">{selectedAnswerIds.length} Selected</span>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-white/10" />
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => handleBulkAction('full')}
                                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">Correct</span>
                            </button>
                            {!EXCLUDED_PARTIAL_TYPES.includes(masterQuestions[selectedQuestionIndex]?.question_type) && (
                                <button
                                    onClick={() => {
                                        const firstBulk = bulkAnswers[0];
                                        setBulkPartialScore(firstBulk?.score_earned || 0);
                                        setIsBulkPartialModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95"
                                >
                                    <MinusCircle className="w-5 h-5" />
                                    <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">Partial</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleFinishCorrection(
                                    bulkAnswers
                                        .filter(a => selectedAnswerIds.includes(a.id))
                                        .map(a => a.session.id)
                                )}
                                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">Finalize</span>
                            </button>
                            <button
                                onClick={() => handleBulkAction('no')}
                                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider">Wrong</span>
                            </button>
                            <button
                                onClick={() => setSelectedAnswerIds([])}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
                                        <MinusCircle className="w-6 h-6" />
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
                                        <MinusCircle className="w-6 h-6" />
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

            {/* Initial Attempt Selection Modal */}
            <AnimatePresence>
                {isAttemptModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                    <Filter className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">Pilih Upaya Ujian</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Beberapa siswa mungkin memiliki lebih dari satu upaya. Silakan pilih prioritas yang ingin Anda koreksi saat ini.
                                </p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <button
                                    onClick={() => setAttemptFilter('latest')}
                                    className={cn(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                                        attemptFilter === 'latest' ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                                    )}
                                >
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white mb-0.5">Upaya Terbaru</div>
                                        <div className="text-[10px] text-slate-500">Hanya munculkan upaya paling akhir tiap siswa</div>
                                    </div>
                                    {attemptFilter === 'latest' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </button>
                                <button
                                    onClick={() => setAttemptFilter('all')}
                                    className={cn(
                                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                                        attemptFilter === 'all' ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                                    )}
                                >
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white mb-0.5">Semua Upaya</div>
                                        <div className="text-[10px] text-slate-500">Tampilkan semua rekaman pengerjaan</div>
                                    </div>
                                    {attemptFilter === 'all' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </button>
                            </div>

                            <button
                                onClick={() => setIsAttemptModalOpen(false)}
                                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20"
                            >
                                Lanjutkan
                            </button>
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
