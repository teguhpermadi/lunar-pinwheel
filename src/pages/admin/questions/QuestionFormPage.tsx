import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { questionApi, optionsApi } from '@/lib/api';
import QuestionFormLayout from '@/components/questions/QuestionFormLayout';
import QuestionInputs from '@/components/questions/QuestionInputs';

export default function QuestionFormPage() {
    const { bankId, questionId } = useParams();
    const navigate = useNavigate();
    const isEditing = !!questionId;

    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);

    // Core Question State
    const [type, setType] = useState('multiple_choice');
    const [difficulty, setDifficulty] = useState('mudah');
    const [timer, setTimer] = useState(30000);
    const [score, setScore] = useState(1);
    const [content, setContent] = useState('');
    const [hint, setHint] = useState('');

    // Internal bankId state
    const [currentBankId, setCurrentBankId] = useState<string | undefined>(bankId);

    // Specific Input States
    const [options, setOptions] = useState<any[]>([
        { key: 'A', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'B', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'C', content: '', is_correct: false, uuid: crypto.randomUUID() },
        { key: 'D', content: '', is_correct: false, uuid: crypto.randomUUID() },
    ]);
    const [matchingPairs, setMatchingPairs] = useState<any[]>([
        { uuid: crypto.randomUUID(), rightUuid: crypto.randomUUID(), left: '', right: '' },
        { uuid: crypto.randomUUID(), rightUuid: crypto.randomUUID(), left: '', right: '' },
    ]);
    const [sequenceItems, setSequenceItems] = useState<any[]>([
        { uuid: crypto.randomUUID(), content: '', order: 1 },
        { uuid: crypto.randomUUID(), content: '', order: 2 },
    ]);
    const [essayKeywords, setEssayKeywords] = useState('');

    // Load question data if editing
    useEffect(() => {
        if (isEditing && questionId) {
            fetchQuestion();
        }
    }, [questionId, isEditing]);

    const initializeOptionsForType = (newType: string) => {
        if (newType === 'true_false') {
            setOptions([
                { key: 'A', content: 'True', is_correct: true, uuid: crypto.randomUUID() },
                { key: 'B', content: 'False', is_correct: false, uuid: crypto.randomUUID() }
            ]);
        } else if (['multiple_choice', 'multiple_selection'].includes(newType)) {
            setOptions([
                { key: 'A', content: '', is_correct: false, uuid: crypto.randomUUID() },
                { key: 'B', content: '', is_correct: false, uuid: crypto.randomUUID() },
                { key: 'C', content: '', is_correct: false, uuid: crypto.randomUUID() },
                { key: 'D', content: '', is_correct: false, uuid: crypto.randomUUID() },
            ]);
        } else if (newType === 'short_answer') {
            setOptions([
                { key: 'SA1', content: '', is_correct: true, uuid: crypto.randomUUID() }
            ]);
        } else if (newType === 'essay') {
            setOptions([]);
            setEssayKeywords('');
        }
    };
    const handleTypeChange = (newType: string) => {
        setType(newType);
        initializeOptionsForType(newType);
    };

    const fetchQuestion = async () => {
        if (!questionId) return;
        setIsLoading(true);
        try {
            const response = await questionApi.getQuestion(questionId);
            if (response.success) {
                const q = response.data;
                setType(q.type);
                setDifficulty(q.difficulty);
                setTimer(q.timer);
                setScore(q.score);
                setContent(q.content);
                setHint(q.hint || '');
                if (q.question_bank_id) setCurrentBankId(q.question_bank_id);

                // Map options
                if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(q.type)) {
                    setOptions(q.options.map((o: any) => ({
                        ...o,
                        key: o.option_key,
                        uuid: o.id || crypto.randomUUID()
                    })));
                } else if (q.type === 'matching') {
                    const pairsMap = new Map();

                    // Group by pair_id from metadata
                    q.options.forEach((o: any) => {
                        const pairId = o.metadata?.pair_id;
                        if (!pairId) return;

                        if (!pairsMap.has(pairId)) {
                            pairsMap.set(pairId, {
                                uuid: crypto.randomUUID(),
                                rightUuid: crypto.randomUUID(),
                                pair_id: pairId,
                                left: '',
                                right: '',
                                leftOptionId: null,
                                rightOptionId: null
                            });
                        }

                        const pair = pairsMap.get(pairId);
                        if (o.metadata?.side === 'left') {
                            pair.left = o.content;
                            pair.leftOptionId = o.id;
                        } else if (o.metadata?.side === 'right') {
                            pair.right = o.content;
                            pair.rightOptionId = o.id;
                        }
                    });

                    setMatchingPairs(Array.from(pairsMap.values()));
                } else if (q.type === 'essay') {
                    const essayOption = q.options.find((o: any) => o.option_key === 'ESSAY');
                    if (essayOption) {
                        setEssayKeywords(essayOption.content);
                    }
                }
            } else {
                throw new Error(response.message || 'Failed to load question');
            }
        } catch (error) {
            console.error("Failed to load question", error);
            Swal.fire('Error', 'Failed to load question', 'error');
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOptionMedia = async (optionUuid: string, mediaId?: string) => {
        const option = options.find(o => o.uuid === optionUuid);
        if (!option) return;

        try {
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
            let finalOptions: any[] = [];
            let extendedData = {};

            switch (type) {
                case 'multiple_choice':
                case 'multiple_selection':
                case 'true_false':
                    finalOptions = options.map((opt, idx) => ({
                        id: opt.id,
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
                            id: p.id, // Keep for backward compat if it was used
                            left: p.left,
                            right: p.right,
                            left_option_id: p.leftOptionId,
                            right_option_id: p.rightOptionId
                        }))
                    };
                    break;
                case 'sequence':
                    extendedData = {
                        sequence_items: sequenceItems.map((item, idx) => ({
                            id: item.id,
                            content: item.content,
                            order: idx + 1
                        }))
                    };
                    break;
                case 'short_answer':
                    finalOptions = options.map((opt, idx) => ({
                        id: opt.id,
                        option_key: opt.key || `SA${idx + 1}`,
                        content: opt.content,
                        is_correct: 1
                    }));

                    if (!finalOptions.some(o => o.content.trim())) {
                        throw new Error('Please provide at least one accepted answer');
                    }
                    break;
                case 'essay':
                    extendedData = { keywords: essayKeywords };
                    break;
            }

            const payload: any = {
                question_bank_id: currentBankId,
                type,
                difficulty,
                timer,
                score,
                content,
                hint,
                options: finalOptions
            };

            if (Object.keys(extendedData).length > 0) {
                Object.assign(payload, extendedData);
            }

            let response;
            if (isEditing && questionId) {
                response = await questionApi.updateQuestion(questionId, payload);
            } else {
                response = await questionApi.createQuestion(payload);
            }

            if (response.success) {
                if (currentBankId) {
                    navigate(`/admin/question-banks/${currentBankId}`, {
                        state: {
                            highlightQuestionId: response.data.id || questionId,
                            action: isEditing ? 'updated' : 'created'
                        }
                    });
                } else {
                    navigate(-1);
                }
            } else {
                throw new Error(response.message || 'Failed to save question');
            }

        } catch (error: any) {
            console.error("Save error", error);
            Swal.fire('Error', error.message || 'Failed to save question', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased h-screen flex flex-col">
                <div className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center gap-4 shrink-0">
                    <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"></div>
                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="flex-1 p-8 space-y-6">
                    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <QuestionFormLayout
            title={isEditing ? "Edit Question" : "Create New Question"}
            type={type}
            setType={handleTypeChange}
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
            isEditing={isEditing}
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

            <QuestionInputs
                type={type}
                options={options}
                setOptions={setOptions}
                handleDeleteOptionMedia={handleDeleteOptionMedia}
                matchingPairs={matchingPairs}
                setMatchingPairs={setMatchingPairs}
                sequenceItems={sequenceItems}
                setSequenceItems={setSequenceItems}
                essayKeywords={essayKeywords}
                setEssayKeywords={setEssayKeywords}
            />

        </QuestionFormLayout>
    );
}
