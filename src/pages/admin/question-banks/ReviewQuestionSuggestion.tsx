import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    questionSuggestionApi, 
    QuestionSuggestion,
    questionApi,
    optionsApi
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    // ArrowLeft,
    CheckCircle2,
    XCircle,
    MessageSquare,
    User,
    Calendar,
    AlertCircle,
    Clock,
    Trash2,
    Zap,
    History,
    Image,
    Eye,
    EyeOff,
    // Info
} from 'lucide-react';
import { cn, generateUUID } from '@/lib/utils';
import QuestionFormLayout from '@/components/questions/QuestionFormLayout';
import QuestionInputs from '@/components/questions/QuestionInputs';
import MediaModal from '@/components/questions/MediaModal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MathRenderer from '@/components/ui/MathRenderer';

const MySwal = withReactContent(Swal);

function StatusBadge({ state, label }: { state: string, label: string }) {
    const configs: Record<string, { bg: string, border: string, text: string, icon: any }> = {
        pending: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
        approved: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        rejected: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', icon: XCircle },
    };

    const config = configs[state] || configs.pending;
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-md",
            config.bg,
            config.border,
            config.text
        )}>
            <Icon className="size-3" />
            {label}
        </span>
    );
}

export default function ReviewQuestionSuggestion() {
    const { bankId, suggestionId } = useParams<{ bankId: string, suggestionId: string }>();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();

    const [suggestion, setSuggestion] = useState<QuestionSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    // Form States
    const [type, setType] = useState('multiple_choice');
    const [difficulty, setDifficulty] = useState('mudah');
    const [timer, setTimer] = useState(30000);
    const [score, setScore] = useState(1);
    const [content, setContent] = useState('');
    const [hint, setHint] = useState('');
    const [readingMaterialId, setReadingMaterialId] = useState<string | null>(null);
    const [questionMedia, setQuestionMedia] = useState<any>(null);
    const [pendingQuestionImage, setPendingQuestionImage] = useState<File | null>(null);
    const [questionPreviewUrl, setQuestionPreviewUrl] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const [options, setOptions] = useState<any[]>([]);
    const [matchingPairs, setMatchingPairs] = useState<any[]>([]);
    const [sequenceItems, setSequenceItems] = useState<any[]>([]);
    const [essayKeywords, setEssayKeywords] = useState('');
    const [mathContent, setMathContent] = useState('');
    const [arabicContent, setArabicContent] = useState('');
    const [javaneseContent, setJavaneseContent] = useState('');
    const [categorizationGroups, setCategorizationGroups] = useState<any[]>([]);
    const [arrangeWordsSentence, setArrangeWordsSentence] = useState('');
    const [arrangeWordsDelimiter, setArrangeWordsDelimiter] = useState(' ');
    const [arrangeWordsIsArabic, setArrangeWordsIsArabic] = useState(false);
    const [arrangeWordsShuffleMode, setArrangeWordsShuffleMode] = useState<'phrase' | 'alphabet'>('phrase');

    const fetchSuggestion = async () => {
        if (!suggestionId) return;
        setIsLoading(true);
        try {
            const response = await questionSuggestionApi.getSuggestion(suggestionId);
            if (response.success) {
                const sug = response.data;
                setSuggestion(sug);
                
                const q = sug.question;
                if (!q) throw new Error("Original question not found");

                const sugData = sug.data || {};
                const finalType = sugData.type || q.type;

                setType(finalType);
                setDifficulty(sugData.difficulty || q.difficulty);
                setTimer(sugData.timer || q.timer);
                setScore(sugData.score || q.score);
                setContent(sugData.content || q.content);
                setHint(sugData.hint !== undefined ? sugData.hint : (q.hint || ''));
                setReadingMaterialId(sugData.reading_material_id !== undefined ? sugData.reading_material_id : (q.reading_material_id || null));
                setQuestionMedia(q.media?.content?.[0] || null);

                // Map data based on type (following QuestionFormPage logic)
                if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(finalType)) {
                    let initialOptions = q.options?.map((o: any) => ({
                        ...o,
                        key: o.option_key,
                        uuid: o.id || generateUUID()
                    })) || [];

                    if (sugData.options?.update) {
                        initialOptions = initialOptions.map((o: any) => {
                            const update = sugData.options.update.find((u: any) => u.id === o.id);
                            return update ? { ...o, ...update } : o;
                        });
                    }

                    if (sugData.options?.create) {
                        const newOptions = sugData.options.create.map((no: any) => ({
                            ...no,
                            uuid: generateUUID(),
                            key: no.option_key || String.fromCharCode(65 + initialOptions.length)
                        }));
                        initialOptions = [...initialOptions, ...newOptions];
                    }
                    setOptions(initialOptions);
                } else if (finalType === 'matching') {
                    const pairsMap = new Map();
                    q.options.forEach((o: any) => {
                        const pairId = o.metadata?.pair_id;
                        if (!pairId) return;
                        if (!pairsMap.has(pairId)) {
                            pairsMap.set(pairId, {
                                uuid: generateUUID(), rightUuid: generateUUID(), pair_id: pairId,
                                left: '', right: '', leftOptionId: null, rightOptionId: null
                            });
                        }
                        const pair = pairsMap.get(pairId);
                        if (o.metadata?.side === 'left') { pair.left = o.content; pair.leftOptionId = o.id; }
                        else if (o.metadata?.side === 'right') { pair.right = o.content; pair.rightOptionId = o.id; }
                    });
                    setMatchingPairs(Array.from(pairsMap.values()));
                    // Note: Suggestion patching for matching is omitted for brevity as it's rarely used in suggestions
                } else if (finalType === 'sequence') {
                    setSequenceItems(q.options.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((o: any) => ({
                        id: o.id, uuid: o.id || generateUUID(), content: o.content, order: o.order
                    })));
                } else if (finalType === 'essay') {
                    const essayOption = q.options.find((o: any) => o.option_key === 'ESSAY');
                    if (essayOption) setEssayKeywords(sugData.keywords || essayOption.content);
                } else if (finalType === 'math_input') {
                    const mathOption = q.options.find((o: any) => o.option_key === 'MATH');
                    if (mathOption) setMathContent(sugData.math_content || mathOption.content);
                } else if (finalType === 'categorization') {
                    const groupsMap = new Map();
                    q.options.forEach((o: any) => {
                        const groupUuid = o.metadata?.group_uuid;
                        const groupTitle = o.metadata?.group_title || 'Uncategorized';
                        if (!groupsMap.has(groupUuid)) groupsMap.set(groupUuid, { uuid: groupUuid || generateUUID(), title: groupTitle, items: [] });
                        groupsMap.get(groupUuid).items.push({ id: o.id, uuid: o.id || generateUUID(), content: o.content });
                    });
                    setCategorizationGroups(Array.from(groupsMap.values()));
                } else if (finalType === 'arrange_words') {
                    const sentenceOption = q.options.find((o: any) => o.option_key === 'SENTENCE');
                    if (sentenceOption) {
                        setArrangeWordsSentence(sugData.arrange_words_sentence || sentenceOption.content);
                        setArrangeWordsDelimiter(sugData.arrange_words_delimiter || sentenceOption.metadata?.delimiter || ' ');
                        setArrangeWordsIsArabic(sugData.arrange_words_is_arabic !== undefined ? sugData.arrange_words_is_arabic : (!!sentenceOption.metadata?.is_arabic));
                        setArrangeWordsShuffleMode(sugData.arrange_words_shuffle_mode || sentenceOption.metadata?.shuffle_mode || 'phrase');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch suggestion', error);
            MySwal.fire('Error', 'Failed to load suggestion details.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestion();
    }, [suggestionId]);

    const handleApprove = async () => {
        if (!suggestion) return;

        const result = await MySwal.fire({
            title: 'Approve Suggestion?',
            text: "This will apply the changes to the question. You can edit the form first.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, approve it!'
        });

        if (result.isConfirmed) {
            setIsSaving(true);
            try {
                // Construct current data to apply
                const currentData: any = {
                    content, type, difficulty, timer, score, hint, reading_material_id: readingMaterialId,
                };

                if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(type)) {
                    currentData.options = {
                        update: options.filter(o => !!o.id).map(o => ({ id: o.id, content: o.content, is_correct: o.is_correct, option_key: o.key })),
                        create: options.filter(o => !o.id).map(o => ({ content: o.content, is_correct: o.is_correct, option_key: o.key }))
                    };
                } else if (type === 'essay') {
                    currentData.keywords = essayKeywords;
                } else if (type === 'math_input') {
                    currentData.math_content = mathContent;
                } else if (type === 'arabic_response') {
                    currentData.arabic_content = arabicContent;
                } else if (type === 'javanese_response') {
                    currentData.javanese_content = javaneseContent;
                } else if (type === 'arrange_words') {
                    currentData.arrange_words_sentence = arrangeWordsSentence;
                    currentData.arrange_words_delimiter = arrangeWordsDelimiter;
                    currentData.arrange_words_is_arabic = arrangeWordsIsArabic;
                    currentData.arrange_words_shuffle_mode = arrangeWordsShuffleMode;
                }

                // Approve with updated data directly (no separate update call)
                const res = await questionSuggestionApi.approveSuggestion(suggestion.id, { data: currentData });
                
                if (res.success) {
                    await MySwal.fire('Approved!', 'Changes have been applied.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to approve', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to approve suggestion.', 'error');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleReject = async () => {
        if (!suggestion) return;
        const result = await MySwal.fire({
            title: 'Reject Suggestion?',
            text: "Are you sure you want to reject this suggestion?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, reject it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await questionSuggestionApi.rejectSuggestion(suggestion.id);
                if (res.success) {
                    await MySwal.fire('Rejected!', 'Suggestion has been rejected.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to reject', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to reject suggestion.', 'error');
            }
        }
    };

    const handleDelete = async () => {
        if (!suggestion) return;
        const result = await MySwal.fire({
            title: 'Delete Suggestion?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await questionSuggestionApi.deleteSuggestion(suggestion.id);
                if (res.success) {
                    MySwal.fire('Deleted!', 'Suggestion has been deleted.', 'success');
                    navigate(`/admin/question-banks/${bankId}/suggestions`);
                }
            } catch (error: any) {
                console.error('Failed to delete', error);
                MySwal.fire('Error!', error.response?.data?.message || 'Failed to delete suggestion.', 'error');
            }
        }
    };

    const handleDeleteOptionMedia = async (optionUuid: string, mediaId?: string) => {
        const option = options.find((o: any) => o.uuid === optionUuid);
        try {
            if (option?.id && mediaId) await optionsApi.deleteMedia(option.id, mediaId);
            setOptions((prev: any) => prev.map((o: any) => o.uuid === optionUuid ? { ...o, media: null } : o));
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
            setPendingQuestionImage(null); setQuestionPreviewUrl(null); return;
        }
        if (!suggestion?.question_id || !questionMedia) return;
        const result = await Swal.fire({
            title: 'Delete existing image?', text: "This action will delete the image from the server immediately.",
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete it!'
        });
        if (result.isConfirmed) {
            try {
                await questionApi.deleteMedia(suggestion.question_id, questionMedia.id);
                setQuestionMedia(null);
            } catch (error) {
                console.error("Delete failed", error);
                Swal.fire('Error', 'Failed to delete image', 'error');
            }
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

    if (!suggestion) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
                <AlertCircle className="size-12 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Suggestion Not Found</h3>
                <button onClick={() => navigate(`/admin/question-banks/${bankId}/suggestions`)} className="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm">Back to List</button>
            </div>
        );
    }

    return (
        <QuestionFormLayout
            title="Review Question Suggestion"
            type={type} setType={setType}
            difficulty={difficulty} setDifficulty={setDifficulty}
            timer={timer} setTimer={setTimer}
            score={score} setScore={setScore}
            hint={hint} setHint={setHint}
            readingMaterialId={readingMaterialId} setReadingMaterialId={setReadingMaterialId}
            onSave={handleApprove} isSaving={isSaving} isEditing={true} bankId={bankId}
            useModalForSettings={true}
        >
            <div className="space-y-8 pb-20">
                {/* Suggester Info Banner */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <StatusBadge state={suggestion.state} label={suggestion.state_label} />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                <User className="size-8" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Suggested by {suggestion.user?.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"><Calendar className="size-3.5 text-primary" />{new Date(suggestion.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                                    <div className="size-1 bg-slate-300 rounded-full"></div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"><Clock className="size-3.5 text-primary" />{new Date(suggestion.created_at).toLocaleTimeString('en-US', { timeStyle: 'short' })}</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowOriginal(!showOriginal)} className={cn("px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm", showOriginal ? "bg-slate-900 text-white border-slate-900 shadow-slate-900/20" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary")}>
                                {showOriginal ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {showOriginal ? "Hide Original" : "Compare with Original"}
                            </button>
                            {suggestion.state === 'pending' && <button onClick={handleReject} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-rose-500/20 flex items-center gap-2"><XCircle className="size-4" />Reject</button>}
                            {isAdmin && <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all border border-transparent" title="Delete Suggestion"><Trash2 className="size-5" /></button>}
                        </div>
                    </div>
                    <div className="mt-6 flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-primary/5">
                        <MessageSquare className="size-5 text-primary shrink-0 mt-1" />
                        <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Suggester's Note</p><p className="text-slate-600 dark:text-slate-300 text-sm font-medium italic">"{suggestion.description || 'No additional note provided.'}"</p></div>
                    </div>
                </motion.div>

                {/* Original Content Comparison Side-by-Side */}
                <AnimatePresence>
                    {showOriginal && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2"><History className="size-4 text-slate-400" /><h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Content</h5></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question Text</p><div className="text-slate-600 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><MathRenderer content={suggestion.question?.content || ''} /></div></div>
                                    <div className="space-y-4"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Options</p><div className="grid grid-cols-1 gap-2">
                                            {suggestion.question?.options?.map((opt: any) => (
                                                <div key={opt.id} className={cn("p-3 rounded-lg border flex items-center justify-between text-xs font-bold", opt.is_correct ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500")}>
                                                    <div className="flex items-center gap-3"><span className="size-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 text-[10px]">{opt.option_key}</span><MathRenderer content={opt.content} /></div>
                                                    {opt.is_correct && <CheckCircle2 className="size-3" />}
                                                </div>
                                            ))}
                                    </div></div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Question Editor */}
                <section className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between"><label className="block text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">Question Editor</label><div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full"><Zap className="size-3" />Live Editing Suggestion</div></div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="flex flex-col md:flex-row min-h-[220px]">
                            <div className="flex-1 p-4 md:p-8">
                                <RichTextEditor value={content} onChange={setContent} placeholder="Tuliskan pertanyaan Anda di sini..." minHeight="min-h-[180px] md:min-h-[220px]" className="text-md leading-relaxed" />
                            </div>
                            <div className="md:w-72 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 flex flex-col items-center justify-center">
                                <div onClick={() => setIsMediaModalOpen(true)} className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all overflow-hidden relative">
                                    {questionPreviewUrl || questionMedia?.url ? (<><img src={questionPreviewUrl || questionMedia?.url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold uppercase tracking-wider">Change Image</span></div></>) 
                                    : (<><div className="size-10 md:size-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><Image className="w-6 h-6 md:w-8 md:h-8" /></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors text-center px-2">Add Question Image</span></>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <QuestionInputs
                    type={type} options={options} setOptions={setOptions} handleDeleteOptionMedia={handleDeleteOptionMedia}
                    matchingPairs={matchingPairs} setMatchingPairs={setMatchingPairs}
                    sequenceItems={sequenceItems} setSequenceItems={setSequenceItems}
                    essayKeywords={essayKeywords} setEssayKeywords={setEssayKeywords}
                    mathContent={mathContent} setMathContent={setMathContent}
                    arabicContent={arabicContent} setArabicContent={setArabicContent}
                    javaneseContent={javaneseContent} setJavaneseContent={setJavaneseContent}
                    categorizationGroups={categorizationGroups} setCategorizationGroups={setCategorizationGroups}
                    arrangeWordsSentence={arrangeWordsSentence} setArrangeWordsSentence={setArrangeWordsSentence}
                    arrangeWordsDelimiter={arrangeWordsDelimiter} setArrangeWordsDelimiter={setArrangeWordsDelimiter}
                    arrangeWordsIsArabic={arrangeWordsIsArabic} setArrangeWordsIsArabic={setArrangeWordsIsArabic}
                    arrangeWordsShuffleMode={arrangeWordsShuffleMode} setArrangeWordsShuffleMode={setArrangeWordsShuffleMode}
                    isEditing={true}
                />
            </div>
            <MediaModal isOpen={isMediaModalOpen} onClose={() => setIsMediaModalOpen(false)} title="Question Image" imageUrl={questionPreviewUrl || questionMedia?.url} onUpload={handleQuestionMediaUpload} onDelete={handleQuestionMediaDelete} />
        </QuestionFormLayout>
    );
}
