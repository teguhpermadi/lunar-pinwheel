import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';
import { QuestionDetail, StudentSession, EXCLUDED_PARTIAL_TYPES, NEEDS_DOUBLE_CORRECTION_TYPES } from '../ExamCorrectionPage';

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
                            <div className="flex flex-col gap-3 mt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                        Question {(selectedQuestionIndex + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700">
                                        {(currentQuestion.question_type || '').replace(/_/g, ' ')}
                                    </span>
                                    {NEEDS_DOUBLE_CORRECTION_TYPES.includes(currentQuestion.question_type) && (
                                        <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[13px]">warning</span>
                                            Needs Review
                                        </span>
                                    )}
                                </div>
                                <MathRenderer
                                    key={`math-${currentQuestion.id || selectedQuestionIndex}`}
                                    className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed line-clamp-2"
                                    content={currentQuestion.question_content || (currentQuestion as any).content || ''}
                                />
                            </div>
                            <div className={cn(
                                "px-4 py-2 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-sm border shrink-0",
                                currentQuestion.score_earned === currentQuestion.max_score ? "bg-emerald-500 text-white border-emerald-400" :
                                    currentQuestion.score_earned > 0 ? "bg-amber-500 text-white border-amber-400" : "bg-rose-500 text-white border-rose-400"
                            )}>
                                <span className="material-symbols-outlined text-[18px]">stars</span>
                                {currentQuestion.score_earned} / {currentQuestion.max_score}
                            </div>
                        </div>

                        <CorrectionDisplay
                            type={currentQuestion.question_type}
                            studentAnswer={currentQuestion.student_answer}
                            options={currentQuestion.options || []}
                            keyAnswer={currentQuestion.key_answer}
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
                            {!EXCLUDED_PARTIAL_TYPES.includes(currentQuestion.question_type) && (
                                <button
                                    onClick={() => {
                                        setPartialScoreData({
                                            maxScore: currentQuestion.max_score,
                                            currentScore: currentQuestion.score_earned || 0,
                                            studentName: currentSession?.student.name
                                        });
                                        setIsPartialModalOpen(true);
                                    }}
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
    );
};

export default CorrectionByStudent;
