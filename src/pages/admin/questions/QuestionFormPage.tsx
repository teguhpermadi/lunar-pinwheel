import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { questionApi, optionsApi } from '@/lib/api';
import QuestionFormLayout from '@/components/questions/QuestionFormLayout';
import QuestionInputs from '@/components/questions/QuestionInputs';
import MediaModal from '@/components/questions/MediaModal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { generateUUID } from '@/lib/utils';

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
    const [questionMedia, setQuestionMedia] = useState<any>(null);
    const [pendingQuestionImage, setPendingQuestionImage] = useState<File | null>(null);
    const [questionPreviewUrl, setQuestionPreviewUrl] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    // Internal bankId state
    const [currentBankId, setCurrentBankId] = useState<string | undefined>(bankId);

    // Specific Input States
    const [options, setOptions] = useState<any[]>([
        { key: 'A', content: '', is_correct: false, uuid: generateUUID() },
        { key: 'B', content: '', is_correct: false, uuid: generateUUID() },
        { key: 'C', content: '', is_correct: false, uuid: generateUUID() },
        { key: 'D', content: '', is_correct: false, uuid: generateUUID() },
    ]);
    const [matchingPairs, setMatchingPairs] = useState<any[]>([
        { uuid: generateUUID(), rightUuid: generateUUID(), left: '', right: '' },
        { uuid: generateUUID(), rightUuid: generateUUID(), left: '', right: '' },
    ]);
    const [sequenceItems, setSequenceItems] = useState<any[]>([
        { uuid: generateUUID(), content: '', order: 1 },
        { uuid: generateUUID(), content: '', order: 2 },
    ]);
    const [essayKeywords, setEssayKeywords] = useState('');
    const [mathContent, setMathContent] = useState('');
    const [arabicContent, setArabicContent] = useState('');
    const [javaneseContent, setJavaneseContent] = useState('');
    const [categorizationGroups, setCategorizationGroups] = useState<any[]>([
        { uuid: generateUUID(), title: 'Category 1', items: [{ uuid: generateUUID(), content: '' }] },
        { uuid: generateUUID(), title: 'Category 2', items: [{ uuid: generateUUID(), content: '' }] },
    ]);


    // Load question data if editing
    useEffect(() => {
        if (isEditing && questionId) {
            fetchQuestion();
        }
    }, [questionId, isEditing]);

    const initializeOptionsForType = (newType: string) => {
        if (newType === 'true_false') {
            setOptions([
                { key: 'A', content: 'True', is_correct: true, uuid: generateUUID() },
                { key: 'B', content: 'False', is_correct: false, uuid: generateUUID() }
            ]);
        } else if (['multiple_choice', 'multiple_selection'].includes(newType)) {
            setOptions([
                { key: 'A', content: '', is_correct: false, uuid: generateUUID() },
                { key: 'B', content: '', is_correct: false, uuid: generateUUID() },
                { key: 'C', content: '', is_correct: false, uuid: generateUUID() },
                { key: 'D', content: '', is_correct: false, uuid: generateUUID() },
            ]);
        } else if (newType === 'short_answer') {
            setOptions([
                { key: 'SA1', content: '', is_correct: true, uuid: generateUUID() }
            ]);
        } else if (newType === 'sequence') {
            setSequenceItems([
                { uuid: generateUUID(), content: '', order: 1 },
                { uuid: generateUUID(), content: '', order: 2 },
            ]);
        } else if (newType === 'essay') {
            setOptions([]);
            setEssayKeywords('');
        } else if (newType === 'math_input') {
            setOptions([]);
            setMathContent('');
        } else if (newType === 'arabic_response') {
            setOptions([]);
            setArabicContent('');
        } else if (newType === 'javanese_response') {
            setOptions([]);
            setJavaneseContent('');
        } else if (newType === 'categorization') {
            setCategorizationGroups([
                { uuid: generateUUID(), title: 'Category 1', items: [{ uuid: generateUUID(), content: '' }] },
                { uuid: generateUUID(), title: 'Category 2', items: [{ uuid: generateUUID(), content: '' }] },
            ]);
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
                setQuestionMedia(q.media?.content?.[0] || null);
                if (q.question_bank_id) setCurrentBankId(q.question_bank_id);

                // Map options
                if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(q.type)) {
                    setOptions(q.options.map((o: any) => ({
                        ...o,
                        key: o.option_key,
                        uuid: o.id || generateUUID()
                    })));
                } else if (q.type === 'matching') {
                    const pairsMap = new Map();

                    // Group by pair_id from metadata
                    q.options.forEach((o: any) => {
                        const pairId = o.metadata?.pair_id;
                        if (!pairId) return;

                        if (!pairsMap.has(pairId)) {
                            pairsMap.set(pairId, {
                                uuid: generateUUID(),
                                rightUuid: generateUUID(),
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
                } else if (q.type === 'sequence') {
                    setSequenceItems(q.options
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((o: any) => ({
                            id: o.id,
                            uuid: o.id || generateUUID(),
                            content: o.content,
                            order: o.order
                        })));
                } else if (q.type === 'essay') {
                    const essayOption = q.options.find((o: any) => o.option_key === 'ESSAY');
                    if (essayOption) {
                        setEssayKeywords(essayOption.content);
                    }
                } else if (q.type === 'math_input') {
                    const mathOption = q.options.find((o: any) => o.option_key === 'MATH');
                    if (mathOption) {
                        setMathContent(mathOption.content);
                    }
                } else if (q.type === 'arabic_response') {
                    const arabicOption = q.options.find((o: any) => o.option_key === 'ARABIC');
                    if (arabicOption) {
                        setArabicContent(arabicOption.content);
                    }
                } else if (q.type === 'javanese_response') {
                    const javaneseOption = q.options.find((o: any) => o.option_key === 'JAVANESE');
                    if (javaneseOption) {
                        setJavaneseContent(javaneseOption.content);
                    }
                } else if (q.type === 'categorization') {
                    const groupsMap = new Map();
                    q.options.forEach((o: any) => {
                        const title = o.metadata?.category_title || 'Uncategorized';
                        if (!groupsMap.has(title)) {
                            groupsMap.set(title, {
                                uuid: generateUUID(),
                                title: title,
                                items: []
                            });
                        }
                        groupsMap.get(title).items.push({
                            id: o.id,
                            uuid: o.id || generateUUID(),
                            content: o.content,
                            media: o.media?.option_media?.[0] || null
                        });
                    });
                    setCategorizationGroups(Array.from(groupsMap.values()));
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
        const option = options.find((o: any) => o.uuid === optionUuid);
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

            setOptions((prev: any) => prev.map((o: any) =>
                o.uuid === optionUuid ? { ...o, media: null } : o
            ));

            setCategorizationGroups((prev: any) => prev.map((g: any) => ({
                ...g,
                items: g.items.map((i: any) =>
                    i.uuid === optionUuid ? { ...i, media: null, previewUrl: null, pendingImage: null } : i
                )
            })));
        } catch (error) {
            console.error("Failed to delete media", error);
            Swal.fire('Error', 'Failed to delete media', 'error');
        }
    };

    const handleQuestionMediaUpload = (file: File) => {
        setPendingQuestionImage(file);
        setQuestionPreviewUrl(URL.createObjectURL(file));
        setIsMediaModalOpen(false);
    };


    const handleQuestionMediaDelete = async () => {
        setIsMediaModalOpen(false);
        if (pendingQuestionImage) {
            if (questionPreviewUrl) URL.revokeObjectURL(questionPreviewUrl);
            setPendingQuestionImage(null);
            setQuestionPreviewUrl(null);
            return;
        }

        if (!questionId || !questionMedia) return;

        const result = await Swal.fire({
            title: 'Delete existing image?',
            text: "This action will delete the image from the server immediately.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await questionApi.deleteMedia(questionId, questionMedia.id);
                setQuestionMedia(null);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Image deleted',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                console.error("Delete failed", error);
                Swal.fire('Error', 'Failed to delete image', 'error');
            }
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            Swal.fire('Error', 'Question text is required', 'error');
            return;
        }

        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append('question_bank_id', currentBankId || '');
            formData.append('type', type);
            formData.append('difficulty', difficulty);
            formData.append('timer', timer.toString());
            formData.append('score', score.toString());
            formData.append('content', content);
            formData.append('hint', hint);

            if (pendingQuestionImage) {
                formData.append('question_image', pendingQuestionImage);
            }

            // Append Options / Extended Data
            switch (type) {
                case 'multiple_choice':
                case 'multiple_selection':
                case 'true_false':
                case 'short_answer':
                    options.forEach((opt: any, idx: number) => {
                        if (opt.id) {
                            formData.append(`options[${idx}][id]`, opt.id);
                        }
                        formData.append(`options[${idx}][option_key]`, opt.key || (type === 'short_answer' ? `SA${idx + 1}` : String.fromCharCode(65 + idx)));
                        formData.append(`options[${idx}][content]`, opt.content);
                        formData.append(`options[${idx}][is_correct]`, opt.is_correct ? '1' : '0');
                        if (opt.pendingImage) {
                            formData.append(`options[${idx}][image]`, opt.pendingImage);
                        }
                    });

                    if (type === 'multiple_choice' && !options.some((o: any) => o.is_correct)) {
                        throw new Error('Please select a correct answer');
                    }
                    if (type === 'multiple_selection' && !options.some((o: any) => o.is_correct)) {
                        throw new Error('Please select at least one correct answer');
                    }
                    if (type === 'short_answer' && !options.some((o: any) => o.content.trim())) {
                        throw new Error('Please provide at least one accepted answer');
                    }
                    break;
                case 'matching':
                    matchingPairs.forEach((p: any, idx: number) => {
                        formData.append(`matching_pairs[${idx}][left]`, p.left);
                        formData.append(`matching_pairs[${idx}][right]`, p.right);
                    });
                    break;
                case 'sequence':
                    sequenceItems.forEach((item: any, idx: number) => {
                        formData.append(`sequence_items[${idx}][content]`, item.content);
                        formData.append(`sequence_items[${idx}][order]`, (idx + 1).toString());
                    });
                    break;
                case 'essay':
                    formData.append('keywords', essayKeywords);
                    break;
                case 'math_input':
                    formData.append('math_content', mathContent);
                    break;
                case 'arabic_response':
                    formData.append('arabic_content', arabicContent);
                    break;
                case 'javanese_response':
                    formData.append('javanese_content', javaneseContent);
                    break;
                case 'categorization':
                    categorizationGroups.forEach((group: any, gIdx: number) => {
                        formData.append(`categorization_groups[${gIdx}][title]`, group.title);
                        group.items.forEach((item: any, iIdx: number) => {
                            formData.append(`categorization_groups[${gIdx}][items][${iIdx}][content]`, item.content);
                            if (item.pendingImage) {
                                formData.append(`categorization_groups[${gIdx}][items][${iIdx}][image]`, item.pendingImage);
                            }
                        });
                    });
                    break;
            }


            let response;
            if (isEditing && questionId) {
                response = await questionApi.updateQuestion(questionId, formData);
            } else {
                response = await questionApi.createQuestion(formData);
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

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                    <div className="flex flex-col md:flex-row min-h-[220px]">
                        <div className="flex-1 p-8">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Tuliskan pertanyaan Anda di sini..."
                                minHeight="min-h-[220px]"
                                className="text-md leading-relaxed"
                            />
                        </div>

                        <div className="md:w-72 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 flex flex-col items-center justify-center">
                            <div
                                onClick={() => setIsMediaModalOpen(true)}
                                className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all overflow-hidden relative"
                            >
                                {questionPreviewUrl || questionMedia?.url ? (
                                    <>
                                        <img
                                            src={questionPreviewUrl || questionMedia?.url}
                                            alt="Preview"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">Change Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-3xl">image</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Add Question Image</span>
                                    </>
                                )}
                            </div>

                            <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-tighter">
                                Image will appear next to the question
                            </p>
                        </div>
                    </div>
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
                mathContent={mathContent}
                setMathContent={setMathContent}
                arabicContent={arabicContent}
                setArabicContent={setArabicContent}
                javaneseContent={javaneseContent}
                setJavaneseContent={setJavaneseContent}
                categorizationGroups={categorizationGroups}
                setCategorizationGroups={setCategorizationGroups}
                isEditing={isEditing}
            />


            <MediaModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                title="Question Image"
                imageUrl={questionPreviewUrl || questionMedia?.url}
                onUpload={handleQuestionMediaUpload}
                onDelete={handleQuestionMediaDelete}
            />
        </QuestionFormLayout>
    );
}
