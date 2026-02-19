import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { questionApi, optionsApi } from '@/lib/api';
import QuestionFormLayout from '@/components/questions/QuestionFormLayout';
import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';
import TrueFalseInput from '@/components/questions/inputs/TrueFalseInput';
import MatchingInput from '@/components/questions/inputs/MatchingInput';
import SequenceInput from '@/components/questions/inputs/SequenceInput';
import EssayInput from '@/components/questions/inputs/EssayInput';

export default function CreateQuestionPage() {
    const { bankId } = useParams<{ bankId: string }>();
    const navigate = useNavigate();

    // Core Question State
    const [type, setType] = useState('multiple_choice');
    const [difficulty, setDifficulty] = useState('mudah');
    const [timer, setTimer] = useState(60000);
    const [score, setScore] = useState(5);
    const [content, setContent] = useState('');
    const [hint, setHint] = useState('');

    // Specific Input States
    const [options, setOptions] = useState<any[]>([
        { key: 'A', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'B', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'C', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'D', content: '', is_correct: false, uuid: crypto.randomUUID() },
    ]);
    const [matchingPairs, setMatchingPairs] = useState<any[]>([
        { uuid: crypto.randomUUID(), left: '', right: '' },
        { uuid: crypto.randomUUID(), left: '', right: '' },
    ]);
    const [sequenceItems, setSequenceItems] = useState<any[]>([
        { uuid: crypto.randomUUID(), content: '', order: 1 },
        { uuid: crypto.randomUUID(), content: '', order: 2 },
    ]);
    const [essayKeywords, setEssayKeywords] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    // Reset specific states when type changes
    useEffect(() => {
        if (type === 'true_false') {
            setOptions([
                { key: 'A', content: 'True', is_correct: true, uuid: crypto.randomUUID() },
                { key: 'B', content: 'False', is_correct: false, uuid: crypto.randomUUID() }
            ]);
        }
    }, [type]);

    const handleDeleteOptionMedia = async (optionUuid: string, mediaId?: string) => {
        const option = options.find(o => o.uuid === optionUuid);
        if (!option) return;

        try {
            // If option has a real ID (saved in DB) and mediaId exists, call API
            // In Create page, typically options don't have IDs yet, but logic is here for consistency/scalability
            if (option.id && mediaId) {
                await optionsApi.deleteMedia(option.id, mediaId);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Media deleted',
                    showConfirmButton: false,
                    timer: 1500
                });
            }

            // Always update local state
            setOptions(prev => prev.map(o =>
                o.uuid === optionUuid ? { ...o, media: null } : o
            ));
        } catch (error) {
            console.error("Failed to delete media", error);
            Swal.fire('Error', 'Failed to delete media', 'error');
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            Swal.fire('Error', 'Question text is required', 'error');
            return;
        }

        setIsSaving(true);

        try {
            // Transform data based on type
            let finalOptions: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let extendedData = {};

            switch (type) {
                case 'multiple_choice':
                case 'multiple_selection':
                case 'true_false':
                    finalOptions = options.map((opt, idx) => ({
                        option_key: opt.key || String.fromCharCode(65 + idx),
                        content: opt.content,
                        is_correct: opt.is_correct ? 1 : 0
                    }));

                    if (type === 'multiple_choice' && !finalOptions.some(o => o.is_correct)) {
                        throw new Error('Please select a correct answer');
                    }
                    if (type === 'multiple_selection' && !finalOptions.some(o => o.is_correct)) {
                        throw new Error('Please select at least one correct answer');
                    }
                    break;
                case 'matching':
                    extendedData = {
                        matching_pairs: matchingPairs.map(p => ({
                            left: p.left,
                            right: p.right
                        }))
                    };
                    break;
                case 'sequence':
                    extendedData = {
                        sequence_items: sequenceItems.map((item, idx) => ({
                            content: item.content,
                            order: idx + 1
                        }))
                    };
                    break;
                case 'essay':
                    extendedData = { keywords: essayKeywords };
                    break;
            }

            const payload: any = {
                question_bank_id: bankId,
                type,
                difficulty,
                timer,
                score,
                content,
                options: finalOptions
            };

            // Add extended data if API supports it, or stringify into content/options
            // For now, let's assume standard options structure is used where possible
            // or we might need to adjust based on backend requirement.

            if (Object.keys(extendedData).length > 0) {
                Object.assign(payload, extendedData);
            }

            const response = await questionApi.createQuestion(payload);

            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Question Created',
                    showConfirmButton: false,
                    timer: 1500,
                    position: 'top-end'
                });
                // Navigate back to the specific bank with the new question ID to highlight
                navigate(`/admin/question-banks/${bankId}`, {
                    state: {
                        highlightQuestionId: response.data.id,
                        action: 'created'
                    }
                });
            } else {
                throw new Error(response.message || 'Failed to create question');
            }

        } catch (error: any) {
            console.error("Save error", error);
            Swal.fire('Error', error.message || 'Failed to save question', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <QuestionFormLayout
            title="Create New Question"
            type={type}
            setType={setType}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            timer={timer}
            setTimer={setTimer}
            score={score}
            setScore={setScore}
            hint={hint}
            setHint={setHint}
            onSave={handleSave}
            isSaving={isSaving}
        >
            <section className="flex-1 space-y-4 w-full">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Question Text</label>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all h-[180px]">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full bg-transparent border-none text-lg leading-relaxed focus:ring-0 p-6 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none"
                        placeholder="Enter your question here..."
                    />
                </div>
            </section>

            {type === 'multiple_choice' && (
                <MultipleChoiceInput options={options} onChange={setOptions} onDeleteMedia={handleDeleteOptionMedia} />
            )}
            {type === 'multiple_selection' && (
                <MultipleSelectionInput options={options} onChange={setOptions} />
            )}
            {type === 'true_false' && (
                <TrueFalseInput options={options} onChange={setOptions} />
            )}
            {type === 'matching' && (
                <MatchingInput pairs={matchingPairs} onChange={setMatchingPairs} />
            )}
            {type === 'sequence' && (
                <SequenceInput items={sequenceItems} onChange={setSequenceItems} />
            )}
            {type === 'essay' && (
                <EssayInput keywords={essayKeywords} onKeywordsChange={setEssayKeywords} />
            )}

        </QuestionFormLayout>
    );
}
