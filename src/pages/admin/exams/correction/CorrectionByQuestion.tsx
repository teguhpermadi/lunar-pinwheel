import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import CorrectionDisplay from '@/components/questions/correction/CorrectionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';
import { EXCLUDED_PARTIAL_TYPES, NEEDS_DOUBLE_CORRECTION_TYPES } from '../ExamCorrectionPage';
import {
    AlertTriangle,
    SquareMinus,
    SquareCheck,
    ChevronLeft,
    ChevronRight,
    Check,
    Star,
    CheckCircle2,
    MinusCircle,
    XCircle,
    ShieldCheck,
    UserX,
    BookOpen,
    X,
    Maximize,
    RotateCw,
    Edit3,
    Undo2
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

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
import StudentArrangeWordsInput from '@/components/questions/student-inputs/StudentArrangeWordsInput';

interface CorrectionByQuestionProps {
    selectedQuestionIndex: number;
    masterQuestions: any[];
    currentQuestionContent: string;
    currentQuestionType?: string;
    handleToggleSelectAll: () => void;
    selectedAnswerIds: string[];
    bulkAnswers: any[];
    setSelectedQuestionIndex: (index: number) => void;
    isBulkLoading: boolean;
    toggleAnswerSelection: (id: string) => void;
    handleUpdateCorrection: (score: number, isCorrect: boolean, detailIdOverride?: string, sessionIdOverride?: string, notes?: string) => void;
    handleUpdateStudentAnswer: (detailId: string, sessionId: string, studentAnswer: string | string[] | number[]) => void;
    handleRestoreStudentAnswer: (detailId: string, sessionId: string) => void;
    setPartialScoreData: (data: any) => void;
    setIsPartialModalOpen: (open: boolean) => void;
    isAdmin?: boolean;
    setBulkAnswers: (answers: any[]) => void;
    onRefresh?: () => void;
}

const CorrectionByQuestion: React.FC<CorrectionByQuestionProps> = ({
    selectedQuestionIndex,
    masterQuestions,
    currentQuestionContent,
    currentQuestionType,
    handleToggleSelectAll,
    selectedAnswerIds,
    bulkAnswers,
    setSelectedQuestionIndex,
    isBulkLoading,
    toggleAnswerSelection,
    handleUpdateCorrection,
    handleUpdateStudentAnswer,
    handleRestoreStudentAnswer,
    setPartialScoreData,
    setIsPartialModalOpen,
    setBulkAnswers,
    onRefresh
}) => {
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<any>(null);
    const [isSavingAnswer, setIsSavingAnswer] = useState(false);

    useEffect(() => {
        setIsPreviewModalOpen(false);
        setEditingAnswerId(null);
        setEditedAnswer(null);
    }, [selectedQuestionIndex]);

    const contentRaw = currentQuestionContent || '';

    // Get current master question to extract reading material if any
    const currentMasterQuestion = masterQuestions[selectedQuestionIndex];
    const readingMaterial = currentMasterQuestion?.exam_reading_material || currentMasterQuestion?.exam_question?.exam_reading_material;

    return (
        <motion.div
            key={`bulk-${selectedQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-20">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 overflow-hidden">
                        <div className="flex flex-col gap-1 shrink-0 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                    Q{(selectedQuestionIndex + 1).toString().padStart(2, '0')}
                                </span>
                                {currentQuestionType && (
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-[100px]">
                                        {currentQuestionType.replace(/_/g, ' ')}
                                    </span>
                                )}
                            </div>
                            {currentQuestionType && NEEDS_DOUBLE_CORRECTION_TYPES.includes(currentQuestionType) && (
                                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-amber-200 dark:border-amber-500/20 flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Needs Review
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="line-clamp-2">
                                <MathRenderer
                                    key={`math-${selectedQuestionIndex}`}
                                    className="text-sm font-bold text-slate-900 dark:text-white leading-tight"
                                    content={contentRaw}
                                />
                            </div>
                            <button
                                onClick={() => setIsPreviewModalOpen(true)}
                                className="text-[10px] text-primary hover:text-primary/80 font-bold self-start mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                Preview Soal
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center mt-1 shrink-0">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-all active:scale-95"
                                title="Refresh Data"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={handleToggleSelectAll}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 border rounded-xl transition-all text-[10px] font-black uppercase",
                                selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0
                                    ? "bg-primary text-white border-primary"
                                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-primary/50"
                            )}
                        >
                            {selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0 ? (
                                <SquareMinus className="w-3.5 h-3.5" />
                            ) : (
                                <SquareCheck className="w-3.5 h-3.5" />
                            )}
                            {selectedAnswerIds.length === bulkAnswers.length && bulkAnswers.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                        <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
                        <button
                            onClick={() => setSelectedQuestionIndex(Math.max(0, selectedQuestionIndex - 1))}
                            disabled={selectedQuestionIndex === 0}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedQuestionIndex(Math.min(masterQuestions.length - 1, selectedQuestionIndex + 1))}
                            disabled={selectedQuestionIndex === masterQuestions.length - 1}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
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
                                        {selectedAnswerIds.includes(answer.id) && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold border border-indigo-100 dark:border-indigo-500/20">
                                        {answer.session?.student?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[150px] sm:max-w-[200px]">
                                                {answer.session?.student?.name}
                                            </h4>
                                            {(answer.session?.total_attempts || 1) > 1 && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-bold text-slate-500 rounded tracking-wider shrink-0">
                                                    Upaya {answer.session?.attempt_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1 border shrink-0",
                                                answer.score_earned === answer.max_score ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20" :
                                                    answer.score_earned > 0 ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20" : "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-500/20"
                                            )}>
                                                <Star className="w-3 h-3" />
                                                {answer.score_earned} / {answer.max_score}
                                            </div>
                                            {answer.session?.is_corrected && (
                                                <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider shrink-0">Corrected</span>
                                            )}
                                            {answer.session?.start_time && (
                                                <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                                    {new Date(answer.session.start_time).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                        </div>
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
                                        <CheckCircle2 className="w-4 h-4" />
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
                                                    studentName: answer.session?.student?.name
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
                                            <MinusCircle className="w-4 h-4" />
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
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase">No</span>
                                    </button>
                                    {answer.session?.is_corrected && (
                                        <>
                                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
                                            <span title="Corrected">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Paste Detection Warning */}
                            {(answer.metadata?.is_pasted || answer.metadata?.paste_count > 0) && (
                                <div className="flex items-start gap-3 p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-red-700 dark:text-red-300">
                                            ⚠️ Terdeteksi Salin-Tempel: {answer.metadata?.paste_count || 1}x
                                        </p>
                                        {answer.metadata?.last_pasted_at && (
                                            <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">
                                                Terakhir: {new Date(answer.metadata.last_pasted_at).toLocaleString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <CorrectionDisplay
                                type={answer.exam_question?.question_type || answer.question_type}
                                studentAnswer={editingAnswerId === answer.id ? editedAnswer : answer.student_answer}
                                options={answer.exam_question?.options || answer.options || []}
                                keyAnswer={answer.exam_question?.key_answer || answer.key_answer}
                                maxScore={answer.max_score}
                                scoreEarned={answer.score_earned}
                            />

                            {editingAnswerId !== answer.id ? (
                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingAnswerId(answer.id);
                                                setEditedAnswer(answer.student_answer);
                                            }}
                                            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-primary bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit Answer
                                        </button>
                                        <button
                                            onClick={() => handleRestoreStudentAnswer(answer.id, answer.session.id)}
                                            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-amber-600 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                        >
                                            <Undo2 className="w-3.5 h-3.5" />
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Edit Answer</span>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setEditingAnswerId(null);
                                                    setEditedAnswer(null);
                                                }}
                                                className="px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setIsSavingAnswer(true);
                                                    await handleUpdateStudentAnswer(answer.id, answer.session.id, editedAnswer);
                                                    setIsSavingAnswer(false);
                                                    setEditingAnswerId(null);
                                                    setEditedAnswer(null);
                                                }}
                                                disabled={isSavingAnswer}
                                                className="px-2 py-1 text-[9px] font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isSavingAnswer ? (
                                                    <RotateCw className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                    {(() => {
                                        const qType = answer.exam_question?.question_type || answer.question_type;
                                        const options = answer.exam_question?.options || answer.options || [];
                                        
                                        switch (qType) {
                                            case 'multiple_choice':
                                                return (
                                                    <StudentMultipleChoiceInput
                                                        options={options}
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'multiple_selection':
                                                return (
                                                    <StudentMultipleSelectionInput
                                                        options={options}
                                                        selectedAnswers={Array.isArray(editedAnswer) ? editedAnswer : []}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'true_false':
                                                return (
                                                    <StudentTrueFalseInput
                                                        options={options}
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'essay':
                                                return (
                                                    <StudentEssayInput
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'short_answer':
                                                return (
                                                    <StudentShortAnswerInput
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'matching':
                                                return (
                                                    <StudentMatchingInput
                                                        options={options}
                                                        selectedAnswer={typeof editedAnswer === 'object' ? editedAnswer : {}}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'sequence':
                                                return (
                                                    <StudentSequenceInput
                                                        options={options}
                                                        selectedAnswer={Array.isArray(editedAnswer) ? editedAnswer : []}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'arabic_response':
                                            case 'javanese_response':
                                                return (
                                                    <StudentLanguageResponseInput
                                                        language={qType === 'arabic_response' ? 'arabic' : 'javanese'}
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'math_input':
                                                return (
                                                    <StudentMathInput
                                                        selectedAnswer={editedAnswer}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'categorization':
                                                return (
                                                    <StudentCategorizationInput
                                                        options={options}
                                                        selectedAnswer={typeof editedAnswer === 'object' ? editedAnswer : {}}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            case 'arrange_words':
                                                return (
                                                    <StudentArrangeWordsInput
                                                        options={options}
                                                        selectedAnswer={Array.isArray(editedAnswer) ? editedAnswer : []}
                                                        onChange={(val) => setEditedAnswer(val)}
                                                    />
                                                );
                                            default:
                                                return (
                                                    <textarea
                                                        value={typeof editedAnswer === 'string' ? editedAnswer : JSON.stringify(editedAnswer)}
                                                        onChange={(e) => setEditedAnswer(e.target.value)}
                                                        className="w-full text-[11px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-primary focus:border-primary min-h-[60px] p-2"
                                                        placeholder="Enter student answer..."
                                                    />
                                                );
                                        }
                                    })()}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                        Score: <span className="text-primary tabular-nums">{answer.score_earned}</span>/{answer.max_score}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Evaluation Notes</label>
                                            <button
                                                onClick={() => handleUpdateCorrection(answer.score_earned || 0, answer.is_correct || false, answer.id, answer.session.id, answer.correction_notes)}
                                                className="text-[8px] font-bold text-primary hover:text-primary-dark uppercase px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 transition-all active:scale-95 flex items-center gap-1"
                                            >
                                                <Check className="w-2.5 h-2.5" />
                                                Save
                                            </button>
                                        </div>
                                        {answer.correction_notes && (
                                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[7px] font-black uppercase tracking-widest">
                                                <ShieldCheck className="w-2.5 h-2.5" />
                                                AI Evaluated
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        className="w-full text-[11px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:ring-primary focus:border-primary placeholder-slate-300 min-h-[60px] p-3 italic leading-relaxed"
                                        placeholder="AI Evaluation or teacher notes..."
                                        value={answer.correction_notes || ''}
                                        onChange={(e) => {
                                            const newAnswers = [...bulkAnswers];
                                            const idx = newAnswers.findIndex(a => a.id === answer.id);
                                            if (idx !== -1) {
                                                newAnswers[idx].correction_notes = e.target.value;
                                                setBulkAnswers(newAnswers);
                                            }
                                        }}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <UserX className="w-10 h-10 text-slate-200 mb-4 mx-auto" />
                    <p className="text-slate-400 font-medium">No student responses found for this question.</p>
                </div>
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

export default CorrectionByQuestion;
