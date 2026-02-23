import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi, Exam } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from '@/contexts/AuthContext';

import StudentMultipleChoiceInput from '@/components/questions/student-inputs/StudentMultipleChoiceInput';
import StudentMultipleSelectionInput from '@/components/questions/student-inputs/StudentMultipleSelectionInput';
import StudentTrueFalseInput from '@/components/questions/student-inputs/StudentTrueFalseInput';
import StudentEssayInput from '@/components/questions/student-inputs/StudentEssayInput';
import StudentShortAnswerInput from '@/components/questions/student-inputs/StudentShortAnswerInput';
import StudentMatchingInput from '@/components/questions/student-inputs/StudentMatchingInput';
import StudentSequenceInput from '@/components/questions/student-inputs/StudentSequenceInput';
import StudentLanguageResponseInput from '@/components/questions/student-inputs/StudentLanguageResponseInput';
import StudentMathInput from '@/components/questions/student-inputs/StudentMathInput';

const MySwal = withReactContent(Swal);

export default function ExamTaker() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data State
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('exam_font_size');
        return saved ? parseInt(saved) : 16;
    });
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchExamData();
        }
    }, [id]);

    useEffect(() => {
        localStorage.setItem('exam_font_size', fontSize.toString());
    }, [fontSize]);

    // Timer logic
    useEffect(() => {
        if (remainingSeconds <= 0 || !exam || exam.timer_type !== 'strict') return;

        const timer = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingSeconds, exam]);

    const fetchExamData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await studentApi.takeExam(id);
            if (response.success) {
                setExam(response.data.exam);

                // Handle both plain array and { data: [] } structure
                const rawQuestions = Array.isArray(response.data.questions)
                    ? response.data.questions
                    : (response.data.questions?.data || []);

                // Ensure student_answer is handled if null (important for progress calculation)
                const questionsData = rawQuestions.map((q: any) => {
                    const eq = q.exam_question;
                    const qt = eq?.question_type || eq?.type;

                    // Defensive check: Ensure options is an array
                    if (eq && eq.options && !Array.isArray(eq.options)) {
                        eq.options = Object.values(eq.options);
                    }

                    return {
                        ...q,
                        student_answer: q.student_answer || (qt === 'multiple_selection' || qt === 'sequence' ? [] :
                            (qt === 'matching' ? {} : null))
                    };
                });

                setQuestions(questionsData);
                setRemainingSeconds(response.data.remaining_seconds);
            } else {
                MySwal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Failed to load exam data.',
                }).then(() => navigate('/exams'));
            }
        } catch (error: any) {
            console.error('Failed to fetch exam data:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'An error occurred while loading exam data.',
            }).then(() => navigate('/exams'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = async (answer: any) => {
        if (!id || !questions[currentQuestionIndex]) return;

        const currentQ = questions[currentQuestionIndex];

        // Optimistic Update
        const newQuestions = [...questions];
        newQuestions[currentQuestionIndex].student_answer = answer;
        setQuestions(newQuestions);

        try {
            await studentApi.answerQuestion(id, {
                question_id: currentQ.id,
                answer: answer,
                is_flagged: currentQ.is_flagged
            });
        } catch (error) {
            console.error('Failed to save answer:', error);
            // Optionally revert update or show subtle indicator
        }
    };

    const handleAutoFinish = async () => {
        setIsSubmitting(true);
        try {
            const response = await studentApi.finishExam(id!);
            if (response.success) {
                MySwal.fire({
                    icon: 'warning',
                    title: 'Time is Up!',
                    text: 'Your time for this exam has ended. Your answers have been submitted automatically.',
                    confirmButtonText: 'Great, Thanks!',
                    allowOutsideClick: false,
                }).then(() => navigate('/exams'));
            }
        } catch (error: any) {
            console.error('Auto finish failed:', error);
            // Even if it fails, we should probably redirect because time is up
            navigate('/exams');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isQuestionAnswered = (q: any) => {
        if (q.student_answer === null || q.student_answer === undefined) return false;
        if (Array.isArray(q.student_answer)) return q.student_answer.length > 0;
        if (typeof q.student_answer === 'object') return Object.keys(q.student_answer).length > 0;
        return q.student_answer !== '';
    };

    const handleToggleFlag = async () => {
        if (!currentQuestion) return;
        try {
            const response = await studentApi.answerQuestion(id!, {
                question_id: currentQuestion.id,
                is_flagged: !currentQuestion.is_flagged,
                answer: currentQuestion.student_answer
            });
            if (response.success) {
                const newQuestions = [...questions];
                newQuestions[currentQuestionIndex].is_flagged = !currentQuestion.is_flagged;
                setQuestions(newQuestions);
            }
        } catch (e) { }
    };

    const handleSubmitExam = async () => {
        if (!id) return;
        setIsSubmitting(true);
        try {
            const response = await studentApi.finishExam(id);
            if (response.success) {
                MySwal.fire({
                    icon: 'success',
                    title: 'Exam Submitted',
                    text: 'Your exam has been submitted successfully.',
                }).then(() => navigate('/exams'));
            }
        } catch (error: any) {
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to submit exam.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    const isAllAnswered = () => {
        if (questions.length === 0) return false;
        return questions.every(q => {
            if (Array.isArray(q.student_answer)) return q.student_answer.length > 0;
            if (typeof q.student_answer === 'object' && q.student_answer !== null) return Object.keys(q.student_answer).length === q.exam_question?.options?.filter((o: any) => o.metadata?.side === 'left').length;
            return q.student_answer !== null && q.student_answer !== undefined && q.student_answer !== '';
        });
    };

    const renderQuestionInput = () => {
        const q = currentQuestion;
        if (!q?.exam_question) return null;

        const type = q.exam_question.question_type || q.exam_question.type;
        const options = q.exam_question.options || [];

        switch (type) {
            case 'multiple_choice':
                return <StudentMultipleChoiceInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'multiple_selection':
                return <StudentMultipleSelectionInput
                    options={options}
                    selectedAnswers={q.student_answer || []}
                    onChange={handleAnswerChange}
                />;
            case 'true_false':
                return <StudentTrueFalseInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'essay':
                return <StudentEssayInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'short_answer':
                return <StudentShortAnswerInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'matching':
                return <StudentMatchingInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'sequence':
                return <StudentSequenceInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'arabic_response':
                return <StudentLanguageResponseInput
                    language="arabic"
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'javanese_response':
                return <StudentLanguageResponseInput
                    language="javanese"
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            case 'math_input':
                return <StudentMathInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                />;
            default:
                return (
                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400">
                        <span className="material-icons text-4xl mb-2">extension</span>
                        <p>Question type <b>{type}</b> is not yet supported in this view.</p>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <header className="bg-white dark:bg-gray-800 border-b h-16 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-24" />
                </header>
                <main className="flex-1 flex overflow-hidden">
                    <section className="flex-1 p-6 lg:p-10 flex flex-col items-center">
                        <div className="w-full max-w-4xl space-y-6">
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 lg:p-10 shadow-sm border space-y-6">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="space-y-4 pt-4">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-12 w-32 rounded-lg" />
                                <Skeleton className="h-12 w-48 rounded-lg" />
                            </div>
                        </div>
                    </section>
                    <aside className="w-80 bg-white dark:bg-gray-800 border-l flex flex-col p-6 space-y-6">
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-14 w-full rounded-xl mt-auto" />
                    </aside>
                </main>
            </div>
        );
    }

    if (!exam) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = questions.filter(isQuestionAnswered).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 h-screen flex flex-col overflow-hidden" style={{ fontSize: `${fontSize}px` }}>
            {/* Progress Bar */}
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 shrink-0">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary"
                />
            </div>

            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.name?.substring(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold leading-tight line-clamp-1">{exam.title}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{exam.subject?.name || 'Exam'}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    {exam.timer_type === 'strict' && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Time Remaining</span>
                            <div className={`flex items-center font-bold text-xl font-mono ${remainingSeconds < 300 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                <span className="material-icons text-lg mr-1">timer</span>
                                {formatTime(remainingSeconds)}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => document.documentElement.requestFullscreen()}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <span className="material-icons">fullscreen</span>
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-700"
                    >
                        <span className="material-icons leading-none">
                            {isSidebarOpen ? 'format_indent_increase' : 'format_indent_decrease'}
                        </span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Main Content */}
                <section className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col items-center custom-scrollbar">
                    <div className="w-full max-w-4xl space-y-6 relative">
                        <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <button
                                onClick={handleToggleFlag}
                                className={`flex items-center space-x-2 transition-colors group ${currentQuestion?.is_flagged ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                            >
                                <span className="material-icons">{currentQuestion?.is_flagged ? 'flag' : 'outlined_flag'}</span>
                                <span className="text-sm font-medium">{currentQuestion?.is_flagged ? 'Flagged' : 'Flag for review'}</span>
                            </button>
                        </div>

                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 lg:p-10 relative overflow-hidden min-h-[400px] transition-all duration-300"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {/* Question Container */}
                            <div className="relative z-10">
                                <div
                                    className="font-medium leading-relaxed mb-8 text-gray-900 dark:text-white question-content"
                                    style={{ fontSize: '1.25em' }}
                                    dangerouslySetInnerHTML={{ __html: currentQuestion?.exam_question?.content || '' }}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'IMG') {
                                            setZoomImageUrl((target as HTMLImageElement).src);
                                        }
                                    }}
                                />

                                {/* Answers rendering */}
                                <div
                                    className="mt-8"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'IMG') {
                                            setZoomImageUrl((target as HTMLImageElement).src);
                                        }
                                    }}
                                >
                                    {renderQuestionInput()}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 pb-12">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                <span className="material-icons text-lg mr-2">arrow_back</span>
                                Previous
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleToggleFlag}
                                    className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 flex items-center group font-semibold ${currentQuestion?.is_flagged
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'}`}
                                >
                                    <span className="material-icons text-lg mr-2">help_outline</span>
                                    Doubtful
                                </button>

                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="px-8 py-3 rounded-lg bg-primary text-white font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl transition-all flex items-center transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next Question
                                    <span className="material-icons text-lg ml-2">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 z-20 shadow-xl overflow-hidden fixed lg:relative right-0 top-0 bottom-0 lg:h-full"
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settings</span>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} className="p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all">
                                            <span className="text-[10px] font-bold">A-</span>
                                        </button>
                                        <button onClick={() => setFontSize(prev => Math.min(24, prev + 2))} className="p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-all">
                                            <span className="text-sm font-bold">A+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Question Navigator</h3>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary mr-2 ring-2 ring-primary/20"></span> Current
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span> Answered
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span> Flagged
                                    </div>
                                    <div className="flex items-center">
                                        <span className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 mr-2"></span> Unseen
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, idx) => {
                                        const isCurrent = idx === currentQuestionIndex;
                                        const isAnswered = isQuestionAnswered(q);
                                        const isFlagged = q.is_flagged;

                                        let statusClass = "bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50";

                                        if (isCurrent) {
                                            statusClass = "bg-primary text-white border-primary scale-110 shadow-lg shadow-primary/20 ring-4 ring-primary/10 z-10";
                                        } else if (isFlagged) {
                                            statusClass = "bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20";
                                        } else if (isAnswered) {
                                            statusClass = "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20";
                                        }

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                className={`w-10 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center font-bold text-xs relative ${statusClass}`}
                                            >
                                                {idx + 1}
                                                {isFlagged && !isCurrent && (
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                                <button
                                    disabled={!isAllAnswered()}
                                    onClick={handleSubmitExam}
                                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden ${isAllAnswered()
                                        ? 'bg-gradient-to-r from-primary to-[#ec4899] text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    {isAllAnswered() && (
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                                    )}
                                    <span>Submit Exam</span>
                                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                                        rocket_launch
                                    </span>
                                </button>
                                <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                                    {isAllAnswered() ? "You've answered all questions!" : `You have ${questions.filter(q => q.student_answer === null).length} unanswered questions`}
                                </p>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </main>

            {/* Image Zoom Modal */}
            <AnimatePresence>
                {zoomImageUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setZoomImageUrl(null)}
                    >
                        <motion.button
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-[110]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setZoomImageUrl(null);
                            }}
                        >
                            <span className="material-icons">close</span>
                        </motion.button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative max-w-full max-h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={zoomImageUrl}
                                alt="Zoomed"
                                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="relative">
                        <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl animate-bounce">rocket_launch</span>
                        </div>
                    </div>
                    <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-white">Submitting Exam...</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Please wait while we secure your answers.</p>
                </div>
            )}
        </div>
    );
}
