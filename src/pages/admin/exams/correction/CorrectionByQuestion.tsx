import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import { EXCLUDED_PARTIAL_TYPES } from '../ExamCorrectionPage';

interface CorrectionByQuestionProps {
    selectedQuestionIndex: number;
    masterQuestions: any[];
    currentQuestionContent: string;
    handleToggleSelectAll: () => void;
    selectedAnswerIds: string[];
    bulkAnswers: any[];
    setSelectedQuestionIndex: (index: number) => void;
    isBulkLoading: boolean;
    toggleAnswerSelection: (id: string) => void;
    handleUpdateCorrection: (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string) => void;
    setPartialScoreData: (data: any) => void;
    setIsPartialModalOpen: (open: boolean) => void;
}

const CorrectionByQuestion: React.FC<CorrectionByQuestionProps> = ({
    selectedQuestionIndex,
    masterQuestions,
    currentQuestionContent,
    handleToggleSelectAll,
    selectedAnswerIds,
    bulkAnswers,
    setSelectedQuestionIndex,
    isBulkLoading,
    toggleAnswerSelection,
    handleUpdateCorrection,
    setPartialScoreData,
    setIsPartialModalOpen
}) => {
    return (
        <motion.div
            key={`bulk-${selectedQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded-lg border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                            Q{(selectedQuestionIndex + 1).toString().padStart(2, '0')}
                        </span>
                        <div
                            className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate"
                            dangerouslySetInnerHTML={{ __html: currentQuestionContent }}
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={handleToggleSelectAll}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 border rounded-xl transition-all text-[10px] font-black uppercase",
                                selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0
                                    ? "bg-primary text-white border-primary"
                                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-primary/50"
                            )}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0 ? 'deselect' : 'select_all'}
                            </span>
                            {selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                        <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
                        <button
                            onClick={() => setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1))}
                            disabled={selectedQuestionIndex === 0}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            onClick={() => setSelectedQuestionIndex(Math.min(masterQuestions.length - 1, selectedQuestionIndex + 1))}
                            disabled={selectedQuestionIndex === masterQuestions.length - 1}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {isBulkLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
                        <Skeleton className="h-8 w-40 rounded-lg" />
                        <Skeleton className="h-[150px] w-full rounded-xl" />
                    </div>
                ))
            ) : bulkAnswers.length > 0 ? (
                <div className="space-y-6 pb-20">
                    {bulkAnswers.map((answer) => (
                        <div
                            key={answer.id}
                            id={`session-${answer.exam_session_id}`}
                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md scroll-mt-24"
                        >
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => toggleAnswerSelection(answer.id)}
                                        className={cn(
                                            "size-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all shrink-0",
                                            selectedAnswerIds.includes(answer.id)
                                                ? "bg-primary border-primary text-white"
                                                : "border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                        )}
                                    >
                                        {selectedAnswerIds.includes(answer.id) && <span className="material-symbols-outlined text-[14px]">check</span>}
                                    </div>
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold border border-indigo-100 dark:border-indigo-500/20">
                                        {answer.session?.user?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                            {answer.session?.user?.name}
                                        </h4>
                                        {answer.session?.is_corrected && (
                                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">Corrected</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateCorrection(answer.max_score, true, answer.id, answer.session.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all",
                                            answer.is_correct === true && answer.score_earned === answer.max_score
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-200"
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        <span className="text-[9px] font-black uppercase">Full</span>
                                    </button>
                                    {!EXCLUDED_PARTIAL_TYPES.includes(answer.exam_question?.question_type || answer.question_type) && (
                                        <button
                                            onClick={() => {
                                                setPartialScoreData({
                                                    detailId: answer.id,
                                                    sessionId: answer.session.id,
                                                    maxScore: answer.max_score,
                                                    currentScore: answer.score_earned || 0,
                                                    studentName: answer.session?.user?.name
                                                });
                                                setIsPartialModalOpen(true);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all",
                                                (answer.is_correct === true && answer.score_earned < answer.max_score && answer.score_earned > 0)
                                                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                                    : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-amber-200"
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-sm">adjust</span>
                                            <span className="text-[9px] font-black uppercase">Partial</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleUpdateCorrection(0, false, answer.id, answer.session.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all",
                                            answer.is_correct === false
                                                ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                                : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-rose-200"
                                        )}
                                    >
                                        <span className="material-symbols-outlined text-sm">cancel</span>
                                        <span className="text-[9px] font-black uppercase">No</span>
                                    </button>
                                    {answer.session?.is_corrected && (
                                        <>
                                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
                                            <span className="material-symbols-outlined text-emerald-500" title="Corrected">verified</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <CorrectionDisplay
                                type={answer.exam_question?.question_type || answer.question_type}
                                studentAnswer={answer.student_answer}
                                options={answer.exam_question?.options || answer.options || []}
                                keyAnswer={answer.exam_question?.key_answer || answer.key_answer}
                                maxScore={answer.max_score}
                                scoreEarned={answer.score_earned}
                            />

                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                    Score: <span className="text-primary tabular-nums">{answer.score_earned}</span>/{answer.max_score}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">person_off</span>
                    <p className="text-slate-400 font-medium">No student responses found for this question.</p>
                </div>
            )}
        </motion.div>
    );
};

export default CorrectionByQuestion;
