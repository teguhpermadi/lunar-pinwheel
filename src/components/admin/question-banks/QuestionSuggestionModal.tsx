import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { questionSuggestionApi } from '@/lib/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';

const MySwal = withReactContent(Swal);

interface QuestionSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: any;
    onSuccess?: () => void;
}

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

const QUESTION_FIELDS = [
    { value: 'content', label: 'Isi Soal (Content)' },
    { value: 'hint', label: 'Petunjuk (Hint)' },
    { value: 'difficulty', label: 'Tingkat Kesulitan' },
    { value: 'timer', label: 'Waktu (detik)' },
    { value: 'score', label: 'Poin' },
    { value: 'options', label: 'Pilihan Jawaban (Options)' },
];

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Mudah (Easy)' },
    { value: 'medium', label: 'Sedang (Medium)' },
    { value: 'hard', label: 'Sulit (Hard)' },
];

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function QuestionSuggestionModal({
    isOpen,
    onClose,
    question,
    onSuccess
}: QuestionSuggestionModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [suggestedContent, setSuggestedContent] = useState('');
    const [suggestedHint, setSuggestedHint] = useState('');
    const [suggestedDifficulty, setSuggestedDifficulty] = useState('');
    const [suggestedTimer, setSuggestedTimer] = useState<number | null>(null);
    const [suggestedScore, setSuggestedScore] = useState<number | null>(null);
    const [suggestedOptions, setSuggestedOptions] = useState<SuggestionOption[]>([]);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questionType = question?.exam_question?.type;
    const currentOptions = question?.exam_question?.options || [];

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        if (question?.exam_question?.options) {
            const opts = question.exam_question.options.map((opt: any, idx: number) => ({
                id: opt.id,
                key: opt.option_key || String.fromCharCode(65 + idx),
                content: opt.content,
                is_correct: opt.is_correct,
                media: opt.media,
                uuid: generateUUID(),
                pendingImage: null,
                previewUrl: null,
            }));
            setSuggestedOptions(opts);
        }
    }, [question]);

    const resetForm = () => {
        setSelectedFields([]);
        setSuggestedContent('');
        setSuggestedHint('');
        setSuggestedDifficulty('');
        setSuggestedTimer(null);
        setSuggestedScore(null);
        setDescription('');
        if (question?.exam_question?.options) {
            const opts = question.exam_question.options.map((opt: any, idx: number) => ({
                id: opt.id,
                key: opt.option_key || String.fromCharCode(65 + idx),
                content: opt.content,
                is_correct: opt.is_correct,
                media: opt.media,
                uuid: generateUUID(),
                pendingImage: null,
                previewUrl: null,
            }));
            setSuggestedOptions(opts);
        }
    };

    const handleFieldToggle = (field: string) => {
        setSelectedFields(prev => 
            prev.includes(field) 
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const hasChanges = (field: string): boolean => {
        switch (field) {
            case 'content':
                return suggestedContent !== (question?.exam_question?.content || '');
            case 'hint':
                return suggestedHint !== (question?.exam_question?.hint || '');
            case 'difficulty':
                return suggestedDifficulty !== (question?.exam_question?.difficulty || '');
            case 'timer':
                return suggestedTimer !== (question?.exam_question?.timer || null);
            case 'score':
                return suggestedScore !== (question?.exam_question?.score || null);
            case 'options':
                return hasOptionsChanges();
            default:
                return false;
        }
    };

    const hasOptionsChanges = (): boolean => {
        const original: any[] = question?.exam_question?.options || [];
        if (suggestedOptions.length !== original.length) return true;
        
        for (let i = 0; i < suggestedOptions.length; i++) {
            const orig: any = original[i];
            const sug = suggestedOptions[i];
            if (orig?.id !== sug.id) return true;
            if (orig?.content !== sug.content) return true;
            if (orig?.is_correct !== sug.is_correct) return true;
        }
        return false;
    };

    const generateOptionsDiff = () => {
        const original: any[] = question?.exam_question?.options || [];
        const originalMap = new Map(original.map((o: any) => [o.id, o]));
        const suggestedMap = new Map(suggestedOptions.filter(o => o.id).map(o => [o.id, o]));

        const update: { id: string; content?: string; is_correct?: boolean }[] = [];
        const create: { content: string; is_correct?: boolean }[] = [];
        const deleteIds: string[] = [];

        suggestedOptions.forEach(sug => {
            if (sug.id && originalMap.has(sug.id)) {
                const orig: any = originalMap.get(sug.id);
                if (orig?.content !== sug.content || orig?.is_correct !== sug.is_correct) {
                    update.push({
                        id: sug.id,
                        content: sug.content,
                        is_correct: sug.is_correct,
                    });
                }
            } else if (!sug.id) {
                create.push({
                    content: sug.content,
                    is_correct: sug.is_correct,
                });
            }
        });

        original.forEach((orig: any) => {
            if (!suggestedMap.has(orig.id)) {
                deleteIds.push(orig.id);
            }
        });

        return { update, create, delete: deleteIds };
    };

    const buildSubmitData = () => {
        const data: Record<string, any> = {};

        if (selectedFields.includes('content') && suggestedContent.trim()) {
            data.content = suggestedContent.trim();
        }

        if (selectedFields.includes('hint') && suggestedHint.trim()) {
            data.hint = suggestedHint.trim();
        }

        if (selectedFields.includes('difficulty') && suggestedDifficulty) {
            data.difficulty = suggestedDifficulty;
        }

        if (selectedFields.includes('timer') && suggestedTimer !== null) {
            data.timer = suggestedTimer;
        }

        if (selectedFields.includes('score') && suggestedScore !== null) {
            data.score = suggestedScore;
        }

        if (selectedFields.includes('options') && hasOptionsChanges()) {
            const diff = generateOptionsDiff();
            if (diff.update.length > 0 || diff.create.length > 0 || diff.delete.length > 0) {
                data.options = diff;
            }
        }

        return data;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedFields.length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'Pilih Field',
                text: 'Pilih minimal satu field yang ingin disaran.',
            });
            return;
        }

        const data = buildSubmitData();
        
        if (Object.keys(data).length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'Tidak Ada Perubahan',
                text: 'Tidak ada perubahan yang ditemukan.',
            });
            return;
        }

        if (!description.trim()) {
            MySwal.fire({
                icon: 'warning',
                title: 'Deskripsi Required',
                text: 'Harap isi deskripsi untuk saran Anda.',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await questionSuggestionApi.createSuggestion({
                question_id: question.exam_question?.id,
                description: description.trim(),
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
                onSuccess?.();
                onClose();
            } else {
                throw new Error(response.message || 'Failed to submit suggestion');
            }
        } catch (error: any) {
            console.error('Failed to submit suggestion:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Gagal mengirim suggestion. Silakan coba lagi.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCurrentOptions = () => {
        if (!currentOptions || currentOptions.length === 0) {
            return <p className="text-gray-400 italic">Tidak ada pilihan jawaban</p>;
        }

        return (
            <div className="space-y-2">
                {currentOptions.map((opt: any, idx: number) => (
                    <div 
                        key={opt.id || idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                        <div className={`size-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                            opt.is_correct
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
                        }`}>
                            {opt.option_key || String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            <span dangerouslySetInnerHTML={{ __html: opt.content }} />
                        </div>
                        {opt.is_correct && (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-xs font-medium rounded-full">
                                Benar
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderOptionsInput = () => {
        switch (questionType) {
            case 'multiple_choice':
                return (
                    <MultipleChoiceInput
                        options={suggestedOptions}
                        onChange={setSuggestedOptions}
                    />
                );
            case 'multiple_selection':
                return (
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
                );
            default:
                return (
                    <MultipleChoiceInput
                        options={suggestedOptions}
                        onChange={setSuggestedOptions}
                    />
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Question Suggestion" size="3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                            Question ID
                        </div>
                        <code className="font-mono text-xs">{question?.exam_question?.id}</code>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 text-sm font-medium rounded-full">
                            Tipe
                        </div>
                        <span className="text-sm">{questionType}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Pilih Field yang Ingin Disaran <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {QUESTION_FIELDS.map((field) => {
                            const isSelected = selectedFields.includes(field.value);
                            const isChanged = hasChanges(field.value);
                            
                            return (
                                <button
                                    key={field.value}
                                    type="button"
                                    onClick={() => handleFieldToggle(field.value)}
                                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{field.label}</span>
                                        {isSelected && (
                                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    {isChanged && isSelected && (
                                        <span className="text-xs text-amber-500 mt-1 block">Ada perubahan</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedFields.includes('content') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Isi Soal (Content)
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[120px]">
                                    <div 
                                        className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: question?.exam_question?.content || '<em class="text-gray-400">Tidak ada isi soal</em>' }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <RichTextEditor
                                    value={suggestedContent}
                                    onChange={setSuggestedContent}
                                    placeholder="Masukkan soal yang disarankan..."
                                    minHeight="min-h-[120px]"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {selectedFields.includes('hint') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Petunjuk (Hint)
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 min-h-[80px]">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {question?.exam_question?.hint || <em className="text-gray-400">Tidak ada hint</em>}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <textarea
                                    value={suggestedHint}
                                    onChange={(e) => setSuggestedHint(e.target.value)}
                                    placeholder="Masukkan hint yang disarankan..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {selectedFields.includes('difficulty') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Tingkat Kesulitan
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        question?.exam_question?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                        question?.exam_question?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        question?.exam_question?.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                        {question?.exam_question?.difficulty || 'Tidak ditentukan'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <select
                                    value={suggestedDifficulty}
                                    onChange={(e) => setSuggestedDifficulty(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                >
                                    <option value="">-- Pilih Tingkat Kesulitan --</option>
                                    {DIFFICULTY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {selectedFields.includes('timer') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Waktu (detik)
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {question?.exam_question?.timer || 0} detik
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <input
                                    type="number"
                                    value={suggestedTimer ?? ''}
                                    onChange={(e) => setSuggestedTimer(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Masukkan waktu dalam detik..."
                                    min={0}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {selectedFields.includes('score') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Poin/ Nilai
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {question?.exam_question?.score || 0} poin
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <input
                                    type="number"
                                    value={suggestedScore ?? ''}
                                    onChange={(e) => setSuggestedScore(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Masukkan poin..."
                                    min={0}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {selectedFields.includes('options') && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Pilihan Jawaban (Options)
                        </label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Nilai Saat Ini
                                </span>
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 max-h-[400px] overflow-y-auto">
                                    {renderCurrentOptions()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                                    Saran Baru
                                </span>
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30 max-h-[400px] overflow-y-auto">
                                    {renderOptionsInput()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Deskripsi Saran <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan mengapa perubahan ini diperlukan..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm resize-none"
                        required
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={selectedFields.length === 0 || !description.trim() || isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            'Kirim Suggestion'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}