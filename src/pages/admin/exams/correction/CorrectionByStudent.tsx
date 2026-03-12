import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';
import { QuestionDetail, StudentSession, EXCLUDED_PARTIAL_TYPES, NEEDS_DOUBLE_CORRECTION_TYPES } from '../ExamCorrectionPage';
import {
    AlertTriangle,
    Star,
    CheckCircle2,
    MinusCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    X,
    Maximize
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface CorrectionByStudentProps {
    currentQuestion: QuestionDetail | null;
    isDetailLoading: boolean;
    selectedQuestionIndex: number;
    setSelectedQuestionIndex: (index: number) => void;
    handleUpdateCorrection: (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string) => void;
    setPartialScoreData: (data: any) => void;
    setIsPartialModalOpen: (open: boolean) => void;
    questions: QuestionDetail[];
    sessions: StudentSession[];
    selectedSessionId: string | null;
    setQuestions: (questions: QuestionDetail[]) => void;
}

const CorrectionByStudent: React.FC<CorrectionByStudentProps> = ({
    currentQuestion,
    isDetailLoading,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    handleUpdateCorrection,
    setPartialScoreData,
    setIsPartialModalOpen,
    questions,
    sessions,
    selectedSessionId,
    setQuestions
}) => {
    const currentSession = sessions.find(s => s.id === selectedSessionId);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        setIsPreviewModalOpen(false);
    }, [selectedQuestionIndex, selectedSessionId]);

    const contentRaw = currentQuestion?.question_content || (currentQuestion as any)?.exam_question?.content || (currentQuestion as any)?.content || '';
    const readingMaterial = (currentQuestion as any)?.exam_reading_material || (currentQuestion as any)?.exam_question?.exam_reading_material;

    return (
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
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex flex-col gap-3 mt-1 flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                                        {currentSession?.student?.name}
                                    </h3>
                                    {(currentSession?.total_attempts || 1) > 1 && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded shrink-0">
                                            Upaya {currentSession?.attempt_number} / {currentSession?.total_attempts}
                                        </span>
                                    )}
                                    {currentSession?.start_time && (
                                        <span className="text-[10px] font-medium text-slate-500 shrink-0">
                                            {new Date(currentSession.start_time).toLocaleString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                        Question {(selectedQuestionIndex + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700">
                                        {(currentQuestion.question_type || (currentQuestion as any)?.exam_question?.question_type || '').replace(/_/g, ' ')}
                                    </span>
                                    {NEEDS_DOUBLE_CORRECTION_TYPES.includes(currentQuestion.question_type || (currentQuestion as any)?.exam_question?.question_type) && (
                                        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Needs Review
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <div className="line-clamp-2">
                                        <MathRenderer
                                            key={`math-${currentQuestion.id || selectedQuestionIndex}`}
                                            className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed"
                                            content={contentRaw}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsPreviewModalOpen(true)}
                                        className="text-xs text-primary hover:text-primary/80 font-bold self-start mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Preview Soal
                                    </button>
                                </div>
                            </div>
                            <div className={cn(
                                "px-4 py-2 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-sm border shrink-0",
                                currentQuestion.score_earned === (currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value) ? "bg-emerald-500 text-white border-emerald-400" :
                                    currentQuestion.score_earned > 0 ? "bg-amber-500 text-white border-amber-400" : "bg-rose-500 text-white border-rose-400"
                            )}>
                                <Star className="w-4.5 h-4.5" />
                                {currentQuestion.score_earned} / {(currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value)}
                            </div>
                        </div>

                        <CorrectionDisplay
                            type={currentQuestion.question_type || (currentQuestion as any)?.exam_question?.question_type}
                            studentAnswer={currentQuestion.student_answer}
                            options={currentQuestion.options || (currentQuestion as any)?.exam_question?.options || []}
                            keyAnswer={currentQuestion.key_answer || (currentQuestion as any)?.exam_question?.key_answer}
                            maxScore={currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value}
                            scoreEarned={currentQuestion.score_earned}
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evaluate Response</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Max Score:</span>
                                <span className="text-sm font-black text-primary tabular-nums">{(currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={() => handleUpdateCorrection((currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value), true)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                    currentQuestion.is_correct === true && currentQuestion.score_earned === (currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value)
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50/50"
                                )}
                            >
                                <CheckCircle2 className="w-6 h-6" />
                                <span className="font-bold text-[10px] uppercase tracking-wider">Full Marks</span>
                            </button>
                            {!EXCLUDED_PARTIAL_TYPES.includes(currentQuestion.question_type || (currentQuestion as any)?.exam_question?.question_type) && (
                                <button
                                    onClick={() => {
                                        setPartialScoreData({
                                            maxScore: (currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value),
                                            currentScore: currentQuestion.score_earned || 0,
                                            studentName: currentSession?.student.name
                                        });
                                        setIsPartialModalOpen(true);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                        (currentQuestion.is_correct === true && currentQuestion.score_earned < (currentQuestion.max_score || (currentQuestion as any)?.exam_question?.score_value) && currentQuestion.score_earned > 0)
                                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-amber-200 hover:bg-amber-50/50"
                                    )}
                                >
                                    <MinusCircle className="w-6 h-6" />
                                    <span className="font-bold text-[10px] uppercase tracking-wider">Partial</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleUpdateCorrection(0, false)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all group",
                                    currentQuestion.is_correct === false
                                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                        : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-rose-200 hover:bg-rose-50/50"
                                )}
                            >
                                <XCircle className="w-6 h-6" />
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
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setSelectedQuestionIndex(Math.min(questions.length - 1, selectedQuestionIndex + 1))}
                                        disabled={selectedQuestionIndex === questions.length - 1}
                                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-30"
                                    >
                                        Next
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <AnimatePresence>
                {isPreviewModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                        onClick={() => setIsPreviewModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    Preview Soal
                                </h3>
                                <button
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900 space-y-8">
                                {readingMaterial && (
                                    <div className="mb-8" style={{ fontSize: '16px' }}>
                                        <div className="px-4 py-2 border-b-2 border-primary inline-block mb-4">
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                                {readingMaterial.title}
                                            </h4>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                Reading Material
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                                            {readingMaterial.media_path?.toLowerCase().endsWith('.pdf') ? (
                                                <div className="flex flex-col gap-4">
                                                    <div className="relative w-full aspect-[3/4] sm:aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                                                        <iframe
                                                            src={`${readingMaterial.media_path}#toolbar=0`}
                                                            className="absolute inset-0 w-full h-full border-0"
                                                            title={readingMaterial.title}
                                                        />
                                                    </div>
                                                    <a
                                                        href={readingMaterial.media_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center self-start gap-2 py-2 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg"
                                                    >
                                                        <Maximize className="w-4 h-4" />
                                                        <span>Buka PDF Penuh</span>
                                                    </a>
                                                </div>
                                            ) : (
                                                <MathRenderer
                                                    className="font-medium leading-relaxed text-slate-900 dark:text-white prose dark:prose-invert max-w-none prose-img:rounded-2xl"
                                                    content={readingMaterial.content || ''}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div style={{ fontSize: '18px' }} className="zoom-container">
                                    <MathRenderer
                                        className="font-medium leading-relaxed text-slate-900 dark:text-white"
                                        content={contentRaw}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CorrectionByStudent;
