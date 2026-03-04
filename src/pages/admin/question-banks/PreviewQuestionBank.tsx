import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { questionBankApi, QuestionBank } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import MathRenderer from '@/components/ui/MathRenderer';

import StudentMultipleChoiceInput from '@/components/questions/student-inputs/StudentMultipleChoiceInput';
import StudentMultipleSelectionInput from '@/components/questions/student-inputs/StudentMultipleSelectionInput';
import StudentTrueFalseInput from '@/components/questions/student-inputs/StudentTrueFalseInput';
import StudentEssayInput from '@/components/questions/student-inputs/StudentEssayInput';
import StudentShortAnswerInput from '@/components/questions/student-inputs/StudentShortAnswerInput';
import StudentMatchingInput from '@/components/questions/student-inputs/StudentMatchingInput';
import StudentSequenceInput from '@/components/questions/student-inputs/StudentSequenceInput';
import StudentLanguageResponseInput from '@/components/questions/student-inputs/StudentLanguageResponseInput';
import StudentMathInput from '@/components/questions/student-inputs/StudentMathInput';
import StudentCategorizationInput from '@/components/questions/student-inputs/StudentCategorizationInput';

const MySwal = withReactContent(Swal);

export default function PreviewQuestionBank() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Data State
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('exam_font_size');
        return saved ? parseInt(saved) : 16;
    });
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchQuestionBank();
        }
    }, [id]);

    useEffect(() => {
        localStorage.setItem('exam_font_size', fontSize.toString());
    }, [fontSize]);

    const fetchQuestionBank = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await questionBankApi.getQuestionBank(id);
            if (response.success) {
                setBank(response.data);

                // Map questions to match ExamTaker format
                const rawQuestions = response.data.questions || [];

                const questionsData = rawQuestions.map((q: any) => {
                    const type = q.type;

                    // Format matching ExamTaker expectations
                    const formattedQ = {
                        id: q.id,
                        exam_question: q, // The component expects exam_question.options, exam_question.content etc.
                        student_answer: (type === 'multiple_selection' || type === 'sequence') ? [] :
                            (type === 'matching' || type === 'categorization' ? {} : null),
                        is_flagged: false
                    };

                    return formattedQ;
                });

                setQuestions(questionsData);
            } else {
                MySwal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.message || 'Failed to load question bank data.',
                }).then(() => navigate('/admin/question-banks'));
            }
        } catch (error: any) {
            console.error('Failed to fetch question bank data:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'An error occurred while loading question bank data.',
            }).then(() => navigate('/admin/question-banks'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = async (answer: any) => {
        if (!id || !questions[currentQuestionIndex]) return;

        // Local state update only - no backend save for preview
        const newQuestions = questions.map((q, idx) =>
            idx === currentQuestionIndex ? { ...q, student_answer: answer } : q
        );
        setQuestions(newQuestions);
    };

    const isQuestionAnswered = (q: any) => {
        if (q.student_answer === null || q.student_answer === undefined) return false;
        if (Array.isArray(q.student_answer)) return q.student_answer.length > 0;
        if (typeof q.student_answer === 'object') return Object.keys(q.student_answer).length > 0;
        return q.student_answer !== '';
    };

    const handleToggleFlag = async () => {
        if (!currentQuestion) return;

        // Local state update only
        const newQuestions = [...questions];
        newQuestions[currentQuestionIndex].is_flagged = !currentQuestion.is_flagged;
        setQuestions(newQuestions);
    };

    const handleSubmitExam = async () => {
        MySwal.fire({
            icon: 'success',
            title: 'Preview Selesai',
            text: 'Ini adalah mode preview, tidak ada data yang disimpan.',
        }).then(() => navigate(`/admin/question-banks/${id}/show`));
    };



    const renderQuestionInput = () => {
        const q = currentQuestion;
        if (!q?.exam_question) return null;

        const type = q.exam_question.type;
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
            case 'categorization':
                return <StudentCategorizationInput
                    options={options}
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

    if (!bank) return null;

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
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:min-h-[4rem] min-h-[3rem] flex items-center justify-between px-3 md:px-6 py-1 sm:py-0 shrink-0 z-30 shadow-sm gap-2">
                <div className="flex items-center space-x-2 md:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={() => navigate(`/admin/question-banks/${id}/show`)}
                        className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-all duration-300 border border-gray-200 dark:border-gray-700 mr-2"
                        title="Close Preview"
                    >
                        <span className="material-icons leading-none text-lg sm:text-xl">close</span>
                    </button>
                    <div className="sm:h-10 sm:w-10 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-base">
                        PRE
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Preview Mode</span>
                            <h1 className="sm:text-lg text-sm font-semibold leading-tight line-clamp-1">{bank?.name || 'Loading...'}</h1>
                        </div>
                        <p className="sm:text-xs text-[10px] text-gray-500 dark:text-gray-400">{(bank as any)?.subject?.name || 'Question Bank'}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                    <span className="text-[8px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider">Time Remaining</span>
                    <div className={`flex items-center font-bold sm:text-lg text-base font-mono text-primary`}>
                        <span className="material-icons text-sm sm:text-lg mr-1">timer</span>
                        --:--:--
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => document.documentElement.requestFullscreen()}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 sm:p-2"
                    >
                        <span className="material-icons text-lg sm:text-2xl">fullscreen</span>
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-700"
                    >
                        <span className="material-icons leading-none text-lg sm:text-xl">
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
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 lg:p-10 relative overflow-hidden min-h-[300px] md:min-h-[400px] transition-all duration-300"
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {/* Question Container */}
                            <div className="relative z-10">
                                {currentQuestion?.exam_question?.media?.content && currentQuestion.exam_question.media.content.length > 0 && (
                                    <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-2xl bg-gray-50 dark:bg-gray-800/50 p-2">
                                        <div className="w-full flex flex-col items-center gap-3">
                                            {currentQuestion.exam_question.media.content.map((m: any, mi: number) => {
                                                const url = m?.url || m?.path || '';
                                                const mime = m?.mime || m?.type || '';
                                                const kind = mime.split('/')[0] || (/(jpe?g|png|gif|webp|svg)$/i.test(url) ? 'image' : (/(mp4|webm|ogg)$/i.test(url) ? 'video' : (/(mp3|wav|ogg)$/i.test(url) ? 'audio' : 'file')));

                                                if (!url) return null;

                                                if (kind === 'image') {
                                                    return (
                                                        <img
                                                            key={mi}
                                                            src={url}
                                                            alt={`Question preview ${mi + 1}`}
                                                            className="max-h-[400px] w-auto object-contain cursor-zoom-in rounded-xl"
                                                            onClick={() => setZoomImageUrl(url)}
                                                        />
                                                    );
                                                }

                                                if (kind === 'video') {
                                                    return (
                                                        <video key={mi} controls src={url} className="max-h-[400px] w-full rounded-xl bg-black" />
                                                    );
                                                }

                                                if (kind === 'audio') {
                                                    return (
                                                        <audio key={mi} controls src={url} className="w-full" />
                                                    );
                                                }

                                                return (
                                                    <a key={mi} href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                                                        Open attachment
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                <MathRenderer
                                    className="font-medium leading-relaxed mb-8 text-gray-900 dark:text-white question-content"
                                    content={currentQuestion?.exam_question?.content || ''}
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-12">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center order-2 sm:order-1"
                            >
                                <span className="material-icons text-lg mr-2">arrow_back</span>
                                Previous
                            </button>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto order-1 sm:order-2">
                                <button
                                    onClick={handleToggleFlag}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center group font-semibold ${currentQuestion?.is_flagged
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'}`}
                                >
                                    <span className="material-icons text-lg mr-2">help_outline</span>
                                    Doubtful
                                </button>

                                <button
                                    onClick={() => {
                                        if (currentQuestionIndex === questions.length - 1) {
                                            handleSubmitExam();
                                        } else {
                                            setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
                                        }
                                    }}
                                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary text-white font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl transition-all flex items-center justify-center transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {currentQuestionIndex === questions.length - 1 ? 'Finish Preview' : 'Next Question'}
                                    <span className="material-icons text-lg ml-2">
                                        {currentQuestionIndex === questions.length - 1 ? 'rocket_launch' : 'arrow_forward'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar */}
                <AnimatePresence>
                    <motion.aside
                        initial={false}
                        animate={{
                            width: window.innerWidth >= 1024 ? (isSidebarOpen ? 320 : 0) : '100%',
                            x: window.innerWidth >= 1024 ? 0 : (isSidebarOpen ? 0 : '100%'),
                            opacity: isSidebarOpen ? 1 : 0
                        }}
                        className={cn(
                            "bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 z-[40] shadow-xl overflow-hidden",
                            "fixed inset-0 lg:relative lg:inset-auto",
                            "lg:h-full ml-auto",
                            !isSidebarOpen && "pointer-events-none lg:pointer-events-auto"
                        )}
                    >
                        {/* Mobile Close Button */}
                        <div className="lg:hidden p-4 flex justify-end border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
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
                                onClick={handleSubmitExam}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden bg-gradient-to-r from-primary to-[#ec4899] text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                                <span>Finish Preview</span>
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                                    rocket_launch
                                </span>
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                                Preview mode. Answers will not be saved.
                            </p>
                        </div>
                    </motion.aside>
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
                                src={zoomImageUrl || undefined}
                                alt="Zoomed"
                                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
