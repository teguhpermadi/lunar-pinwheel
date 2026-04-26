import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { questionBankApi, questionSuggestionApi, QuestionBank } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import MathRenderer from '@/components/ui/MathRenderer';
import RichTextEditor from '@/components/ui/RichTextEditor';
import QuestionToolbar from '@/components/questions/QuestionToolbar';
import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';
import QuestionScoreSelector from '@/components/questions/QuestionScoreSelector';

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
import {
    X, Timer, Maximize, Indent, Outdent, Flag, HelpCircle,
    ChevronLeft, ChevronRight, Puzzle, Eye, EyeOff, Trophy, Lightbulb,
    Send, CheckCircle
} from 'lucide-react';

const MySwal = withReactContent(Swal);

interface SuggestionOption {
    id?: string;
    key: string;
    content: string;
    is_correct: boolean;
    media?: any;
    uuid: string;
    pendingImage?: File | null;
    previewUrl?: string | null;
}

const QUESTION_SUGGESTION_FIELDS = [
    { value: 'content', label: 'Isi Soal' },
    { value: 'score', label: 'Poin' },
    { value: 'options', label: 'Pilihan' },
];

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
    const [showAnswer, setShowAnswer] = useState(false);

    // Suggestion Mode State
    const [isSuggestionMode, setIsSuggestionMode] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [suggestedContent, setSuggestedContent] = useState('');
    const [suggestedScore, setSuggestedScore] = useState<number | null>(null);
    const [suggestedOptions, setSuggestedOptions] = useState<SuggestionOption[]>([]);
    const [suggestionDescription, setSuggestionDescription] = useState('');
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
    const [existingSuggestion, setExistingSuggestion] = useState<any>(null);

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
                        student_answer: (type === 'multiple_selection' || type === 'sequence' || type === 'arrange_words') ? [] :
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

    // Suggestion Mode Functions
    const enterSuggestionMode = async () => {
        if (!currentQuestion?.exam_question) return;

        const eq = currentQuestion.exam_question;
        console.log('🔍 [Suggestion] Entering suggestion mode for question:', eq.id);
        
        // Fetch existing suggestions for this question
        try {
            console.log('📡 [Suggestion] Fetching existing suggestions...');
            const response = await questionSuggestionApi.getMySuggestions({
                question_id: eq.id
            });
            console.log('📥 [Suggestion] Response:', response);
            
            // Handle nested response structure (pagination format)
            const suggestionsData = response.data?.data || response.data || [];
            console.log('📊 [Suggestion] Parsed suggestions data:', suggestionsData);
            
            if (response.success && suggestionsData.length > 0) {
                // Found existing suggestion
                console.log('✅ [Suggestion] Found existing suggestion:', suggestionsData[0]);
                const existing = suggestionsData[0];
                setExistingSuggestion(existing);
                
                const data = existing.data || {};
                console.log('📝 [Suggestion] Data from suggestion:', data);
                
                // Populate form with existing suggestion data
                setSuggestedContent(data.content || eq.content || '');
                setSuggestedScore(data.score ?? eq.score ?? null);
                setSuggestionDescription(existing.description || '');
                
                // Handle options from suggestion
                if (data.options) {
                    console.log('📋 [Suggestion] Processing options from suggestion:', data.options);
                    const optsFromSuggestion: SuggestionOption[] = [];
                    
                    // Add existing options with updated values
                    if (data.options.update && data.options.update.length > 0) {
                        data.options.update.forEach((upd: any) => {
                            const origOpt = eq.options?.find((o: any) => o.id === upd.id);
                            if (origOpt) {
                                optsFromSuggestion.push({
                                    id: upd.id,
                                    key: origOpt.option_key || origOpt.key,
                                    content: upd.content,
                                    is_correct: upd.is_correct,
                                    media: origOpt.media,
                                    uuid: generateUUID(),
                                    pendingImage: null,
                                    previewUrl: null,
                                });
                            }
                        });
                    }
                    
                    // Add new options
                    if (data.options.create && data.options.create.length > 0) {
                        data.options.create.forEach((c: any) => {
                            optsFromSuggestion.push({
                                id: undefined,
                                key: String.fromCharCode(65 + optsFromSuggestion.length),
                                content: c.content,
                                is_correct: c.is_correct,
                                media: undefined,
                                uuid: generateUUID(),
                                pendingImage: null,
                                previewUrl: null,
                            });
                        });
                    }
                    
                    // If optsFromSuggestion is empty, show original options
                    if (optsFromSuggestion.length === 0 && eq.options && eq.options.length > 0) {
                        optsFromSuggestion.push(...eq.options.map((opt: any, idx: number) => ({
                            id: opt.id,
                            key: opt.option_key || String.fromCharCode(65 + idx),
                            content: opt.content,
                            is_correct: opt.is_correct,
                            media: opt.media,
                            uuid: generateUUID(),
                            pendingImage: null,
                            previewUrl: null,
                        })));
                    }
                    
                    setSuggestedOptions(optsFromSuggestion);
                } else {
                    // No options in suggestion, show original
                    if (eq.options && eq.options.length > 0) {
                        setSuggestedOptions(eq.options.map((opt: any, idx: number) => ({
                            id: opt.id,
                            key: opt.option_key || String.fromCharCode(65 + idx),
                            content: opt.content,
                            is_correct: opt.is_correct,
                            media: opt.media,
                            uuid: generateUUID(),
                            pendingImage: null,
                            previewUrl: null,
                        })));
                    } else {
                        setSuggestedOptions([]);
                    }
                }
                
                // Determine which fields were modified in existing suggestion
                const fields: string[] = [];
                if (data.content) fields.push('content');
                if (data.score !== undefined) fields.push('score');
                if (data.options) fields.push('options');
                setSelectedFields(fields.length > 0 ? fields : ['content', 'options']);
            } else {
                console.log('📭 [Suggestion] No existing suggestion found, using defaults');
                // No existing suggestion, use default values
                setExistingSuggestion(null);
                setSuggestedContent(eq.content || '');
                setSuggestedScore(eq.score || null);
                
                if (eq.options && eq.options.length > 0) {
                    setSuggestedOptions(eq.options.map((opt: any, idx: number) => ({
                        id: opt.id,
                        key: opt.option_key || String.fromCharCode(65 + idx),
                        content: opt.content,
                        is_correct: opt.is_correct,
                        media: opt.media,
                        uuid: generateUUID(),
                        pendingImage: null,
                        previewUrl: null,
                    })));
                } else {
                    setSuggestedOptions([]);
                }
                
                setSelectedFields(['content', 'options']);
            }
        } catch (error) {
            console.error('❌ [Suggestion] Failed to fetch existing suggestion:', error);
            // On error, use default values
            setExistingSuggestion(null);
            setSuggestedContent(eq.content || '');
            setSuggestedScore(eq.score || null);
            
            if (eq.options && eq.options.length > 0) {
                setSuggestedOptions(eq.options.map((opt: any, idx: number) => ({
                    id: opt.id,
                    key: opt.option_key || String.fromCharCode(65 + idx),
                    content: opt.content,
                    is_correct: opt.is_correct,
                    media: opt.media,
                    uuid: generateUUID(),
                    pendingImage: null,
                    previewUrl: null,
                })));
            } else {
                setSuggestedOptions([]);
            }
            
            setSelectedFields(['content', 'options']);
        }
        
        setIsSuggestionMode(true);
    };

    const exitSuggestionMode = () => {
        setIsSuggestionMode(false);
        setSelectedFields([]);
        setSuggestedContent('');
        setSuggestedScore(null);
        setSuggestedOptions([]);
        setSuggestionDescription('');
        setExistingSuggestion(null);
    };

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleFieldToggle = (field: string) => {
        setSelectedFields(prev => 
            prev.includes(field) 
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const buildSuggestionData = () => {
        const data: Record<string, any> = {};

        if (selectedFields.includes('content') && suggestedContent.trim()) {
            data.content = suggestedContent.trim();
        }

        if (selectedFields.includes('score') && suggestedScore !== null) {
            data.score = suggestedScore;
        }

        if (selectedFields.includes('options') && suggestedOptions.length > 0) {
            data.options = {
                update: suggestedOptions.filter(o => o.id).map(o => ({
                    id: o.id,
                    content: o.content,
                    is_correct: o.is_correct,
                })),
                create: suggestedOptions.filter(o => !o.id).map(o => ({
                    content: o.content,
                    is_correct: o.is_correct,
                })),
            };
        }

        return data;
    };

    const handleSubmitSuggestion = async () => {
        if (selectedFields.length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'Pilih Field',
                text: 'Pilih minimal satu field yang ingin disaran.',
            });
            return;
        }

        const data = buildSuggestionData();
        
        if (Object.keys(data).length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'Tidak Ada Perubahan',
                text: 'Tidak ada perubahan yang ditemukan.',
            });
            return;
        }

        if (!suggestionDescription.trim()) {
            MySwal.fire({
                icon: 'warning',
                title: 'Deskripsi Required',
                text: 'Harap isi deskripsi untuk saran Anda.',
            });
            return;
        }

        setIsSubmittingSuggestion(true);

        try {
            let response;
            
            if (existingSuggestion) {
                // Update existing suggestion
                response = await questionSuggestionApi.updateSuggestion(existingSuggestion.id, {
                    description: suggestionDescription.trim(),
                    data,
                });
                
                if (response.success) {
                    MySwal.fire({
                        icon: 'success',
                        title: 'Suggestion Updated',
                        text: 'Saran Anda berhasil diperbarui!',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    exitSuggestionMode();
                } else {
                    throw new Error(response.message || 'Failed to update suggestion');
                }
            } else {
                // Create new suggestion
                response = await questionSuggestionApi.createSuggestion({
                    question_id: currentQuestion.exam_question?.id,
                    description: suggestionDescription.trim(),
                    data,
                });

                if (response.success) {
                    MySwal.fire({
                        icon: 'success',
                        title: 'Suggestion Submitted',
                        text: 'Terima kasih atas saran Anda!',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    exitSuggestionMode();
                } else {
                    throw new Error(response.message || 'Failed to submit suggestion');
                }
            }
        } catch (error: any) {
            console.error('Failed to submit suggestion:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Gagal mengirim suggestion. Silakan coba lagi.',
            });
        } finally {
            setIsSubmittingSuggestion(false);
        }
    };

    const renderSuggestionFields = () => {
        return (
            <div className="flex flex-wrap gap-2 mb-4">
                {QUESTION_SUGGESTION_FIELDS.map((field) => {
                    const isSelected = selectedFields.includes(field.value);
                    
                    return (
                        <button
                            key={field.value}
                            type="button"
                            onClick={() => handleFieldToggle(field.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                isSelected
                                    ? "bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-300"
                                    : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-amber-300"
                            )}
                        >
                            {field.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderSuggestionContent = () => {
        if (!isSuggestionMode) return null;

        return (
            <div className="space-y-6 mt-6 pt-6 border-t border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb className="size-4" />
                        Suggestion Mode
                    </h4>
                    {existingSuggestion && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded-full">
                            Edit Saran
                        </span>
                    )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Pilih salah satu atau beberapa opsi di bawah ini untuk memberikan saran perbaikan
                </p>
                
                {renderSuggestionFields()}
                
                {selectedFields.includes('score') && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Poin
                        </label>
                        <QuestionScoreSelector
                            initialScore={suggestedScore ?? 1}
                            onScoreChange={(score) => setSuggestedScore(score)}
                        />
                    </div>
                )}

                {selectedFields.includes('content') && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Isi Soal
                        </label>
                        <QuestionToolbar />
                        <RichTextEditor
                            value={suggestedContent}
                            onChange={setSuggestedContent}
                            placeholder="Masukkan soal yang disarankan..."
                            minHeight="min-h-[150px]"
                            className="bg-white dark:bg-slate-900 rounded-xl"
                        />
                    </div>
                )}

                {selectedFields.includes('options') && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pilihan Jawaban
                        </label>
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
                            {currentQuestion?.exam_question?.type === 'multiple_selection' ? (
                                <MultipleSelectionInput
                                    options={suggestedOptions.map(o => ({ ...o, selection_type: 'checkbox' }))}
                                    onChange={(opts) => setSuggestedOptions(opts.map(o => ({
                                        id: o.id,
                                        key: o.key,
                                        content: o.content,
                                        is_correct: o.is_correct,
                                        media: o.media,
                                        uuid: o.uuid,
                                        pendingImage: o.pendingImage,
                                        previewUrl: o.previewUrl,
                                    })))}
                                />
                            ) : (
                                <MultipleChoiceInput
                                    options={suggestedOptions}
                                    onChange={setSuggestedOptions}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Deskripsi Saran <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={suggestionDescription}
                        onChange={(e) => setSuggestionDescription(e.target.value)}
                        placeholder="Jelaskan mengapa perubahan ini diperlukan..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm resize-none"
                        required
                    />
                </div>
                
                <div className="flex justify-end gap-2">
                    <button
                        onClick={exitSuggestionMode}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmitSuggestion}
                        disabled={isSubmittingSuggestion}
                        className="px-4 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isSubmittingSuggestion ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {existingSuggestion ? 'Memperbarui...' : 'Mengirim...'}
                            </>
                        ) : (
                            <>
                                <Send className="size-3.5" />
                                {existingSuggestion ? 'Perbarui' : 'Kirim'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
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
                    showAnswer={showAnswer}
                />;
            case 'multiple_selection':
                return <StudentMultipleSelectionInput
                    options={options}
                    selectedAnswers={q.student_answer || []}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                />;
            case 'true_false':
                return <StudentTrueFalseInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                />;
            case 'essay': {
                const essayKeyAnswer = options.find((o: any) => o.is_correct)?.content;
                return <StudentEssayInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={essayKeyAnswer ? { rubric: essayKeyAnswer } : undefined}
                />;
            }
            case 'short_answer': {
                const shortAnswerKeys = options.filter((o: any) => o.is_correct).map((o: any) => o.content).filter(Boolean);
                return <StudentShortAnswerInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={shortAnswerKeys.length > 0 ? { answers: shortAnswerKeys } : undefined}
                />;
            }
            case 'sequence':
                return <StudentSequenceInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={(q.exam_question as any).key_answer}
                />;
            case 'matching':
                return <StudentMatchingInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={(q.exam_question as any).key_answer}
                />;
            case 'arabic_response': {
                const arabicKeyAnswer = options.find((o: any) => o.is_correct)?.content;
                return <StudentLanguageResponseInput
                    language="arabic"
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={arabicKeyAnswer ? { answers: [arabicKeyAnswer] } : undefined}
                />;
            }
            case 'javanese_response': {
                const javaneseKeyAnswer = options.find((o: any) => o.is_correct)?.content;
                return <StudentLanguageResponseInput
                    language="javanese"
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={javaneseKeyAnswer ? { answers: [javaneseKeyAnswer] } : undefined}
                />;
            }
            case 'math_input': {
                const mathKeyAnswer = options.find((o: any) => o.is_correct)?.content;
                return <StudentMathInput
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={mathKeyAnswer ? { answer: mathKeyAnswer } : undefined}
                />;
            }
            case 'categorization':
                return <StudentCategorizationInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={(q.exam_question as any).key_answer}
                />;
            case 'arrange_words':
                return <StudentArrangeWordsInput
                    options={options}
                    selectedAnswer={q.student_answer}
                    onChange={handleAnswerChange}
                    showAnswer={showAnswer}
                    keyAnswer={(q.exam_question as any).key_answer}
                />;
            default:
                return (
                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-400 flex flex-col items-center">
                        <Puzzle className="size-12 mb-2" />
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
                        <X className="size-5" />
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
                        <Timer className="size-5 mr-1" />
                        --:--:--
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => document.documentElement.requestFullscreen()}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 sm:p-2"
                    >
                        <Maximize className="size-5" />
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-all duration-300 active:scale-95 border border-gray-200 dark:border-gray-700"
                    >
                        {isSidebarOpen ? <Indent className="size-5" /> : <Outdent className="size-5" />}
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
                                <Flag className={cn("size-5", currentQuestion?.is_flagged ? "fill-yellow-500" : "")} />
                                <span className="text-sm font-medium">{currentQuestion?.is_flagged ? 'Flagged' : 'Flag for review'}</span>
                            </button>
                        </div>

                        <div
                            className={cn(
                                "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8 lg:p-10 relative overflow-hidden min-h-[300px] md:min-h-[400px] transition-all duration-300",
                                isSuggestionMode 
                                    ? "border-2 border-amber-400 dark:border-amber-500 animate-suggestion-border" 
                                    : "border border-gray-100 dark:border-gray-700"
                            )}
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
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                        <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
                                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                            {currentQuestion?.exam_question?.score || 0} pts
                                        </span>
                                    </div>
                                </div>
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
                                    {!isSuggestionMode && renderQuestionInput()}
                                </div>

                                {renderSuggestionContent()}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-12">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm order-2 sm:order-1"
                            >
                                <ChevronLeft className="size-4 mr-1.5" />
                                Previous
                            </button>

                            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto order-1 sm:order-2">
                                <button
                                    onClick={handleToggleFlag}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center text-sm font-medium ${currentQuestion?.is_flagged
                                        ? 'bg-yellow-500 border-yellow-500 text-white'
                                        : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'}`}
                                >
                                    <HelpCircle className="size-4 mr-1.5" />
                                    Doubtful
                                </button>

                                {!isSuggestionMode ? (
                                    <button
                                        onClick={enterSuggestionMode}
                                        className="w-full sm:w-auto px-4 py-2 rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-200 flex items-center justify-center text-sm font-medium"
                                    >
                                        <Lightbulb className="size-4 mr-1.5" />
                                        Suggestion
                                    </button>
                                ) : (
                                    <button
                                        onClick={exitSuggestionMode}
                                        className="w-full sm:w-auto px-4 py-2 rounded-lg border bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all duration-200 flex items-center justify-center text-sm font-medium"
                                    >
                                       Exit
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowAnswer(!showAnswer)}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center text-sm font-medium ${showAnswer
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                >
                                    {showAnswer ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
                                    {showAnswer ? 'Hide' : 'Show'}
                                </button>

                                <button
                                    onClick={() => {
                                        if (currentQuestionIndex === questions.length - 1) {
                                            handleSubmitExam();
                                        } else {
                                            setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
                                        }
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-white font-medium shadow-md hover:bg-primary/90 transition-all flex items-center justify-center text-sm"
                                >
                                    {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                                    {currentQuestionIndex === questions.length - 1 ? null : <ChevronRight className="size-4 ml-1.5" />}
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
                                <X className="size-5" />
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
                                <CheckCircle className="size-5 group-hover:translate-x-1 transition-transform" />
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
                            <X className="size-5" />
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
