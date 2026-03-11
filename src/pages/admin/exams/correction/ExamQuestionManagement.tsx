import { useState, useEffect } from 'react';
import { examQuestionApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    Save,
    AlertCircle,
    Search,
    Type,
    ListTodo,
    CheckSquare,
    AlignLeft,
    ArrowUpDown,
    HelpCircle,
    Layout
} from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import QuestionInputs from '@/components/questions/QuestionInputs';
import { Skeleton } from '@/components/ui/skeleton';
import { generateUUID } from '@/lib/utils';
import Swal from 'sweetalert2';
import QuestionScoreSelector from '@/components/questions/QuestionScoreSelector';
import QuestionToolbar from '@/components/questions/QuestionToolbar';

interface ExamQuestionManagementProps {
    examId: string;
    questions: any[];
    onUpdate: () => void;
}

export default function ExamQuestionManagement({ questions: initialQuestions, onUpdate }: ExamQuestionManagementProps) {
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Question States
    const [content, setContent] = useState('');
    const [score, setScore] = useState(0);
    const [type, setType] = useState('multiple_choice');

    // Specific Input States
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

    const currentQuestion = initialQuestions[selectedQuestionIndex];

    // Reset and populate states when question changes
    useEffect(() => {
        if (currentQuestion) {
            setIsQuestionLoading(true);

            // Simulation of loading feel for smooth transition
            const timer = setTimeout(() => {
                const q = currentQuestion;
                setContent(q.content || q.question_content || '');
                setScore(q.score_value || q.score || 0);
                setType(q.question_type);

                // Option mapping
                if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(q.question_type)) {
                    const keyAnswer = q.key_answer;
                    setOptions((q.options || []).map((o: any) => {
                        let isCorrect = false;
                        if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
                            const val = keyAnswer?.answer || keyAnswer;
                            isCorrect = o.option_key === val || o.key === val;
                        } else if (q.question_type === 'multiple_selection') {
                            const val = keyAnswer?.answers || keyAnswer;
                            isCorrect = Array.isArray(val) && (val.includes(o.option_key) || val.includes(o.key));
                        } else if (q.question_type === 'short_answer') {
                            const val = keyAnswer?.answers || keyAnswer;
                            isCorrect = Array.isArray(val) && val.includes(o.content);
                        }

                        return {
                            ...o,
                            key: o.option_key || o.key,
                            uuid: o.id || generateUUID(),
                            is_correct: isCorrect
                        };
                    }));
                } else if (q.question_type === 'matching') {
                    const pairsMap = new Map();
                    (q.options || []).forEach((o: any) => {
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

                    // If simple metadata grouping didn't work, try key_answer fallback
                    if (pairsMap.size === 0 && q.key_answer?.pairs) {
                        const keyPairs = q.key_answer.pairs;
                        Object.entries(keyPairs).forEach(([leftKey, rightKey], idx) => {
                            const leftOpt = (q.options || []).find((o: any) => o.option_key === leftKey);
                            const rightOpt = (q.options || []).find((o: any) => o.option_key === rightKey);
                            if (leftOpt && rightOpt) {
                                pairsMap.set(idx + 1, {
                                    uuid: generateUUID(),
                                    rightUuid: generateUUID(),
                                    pair_id: idx + 1,
                                    left: leftOpt.content,
                                    right: rightOpt.content,
                                    leftOptionId: leftOpt.id,
                                    rightOptionId: rightOpt.id
                                });
                            }
                        });
                    }

                    setMatchingPairs(Array.from(pairsMap.values()));
                } else if (q.question_type === 'sequence') {
                    const keyOrder = q.key_answer?.order || []; // Format: ["A", "B", "C"]
                    const sortedOptions = (q.options || []).sort((a: any, b: any) => {
                        const idxA = keyOrder.indexOf(a.option_key);
                        const idxB = keyOrder.indexOf(b.option_key);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        return (a.order || 0) - (b.order || 0);
                    });

                    setSequenceItems(sortedOptions.map((o: any) => ({
                        id: o.id,
                        uuid: o.id || generateUUID(),
                        content: o.content,
                        order: o.order
                    })));
                } else if (q.question_type === 'essay') {
                    // Essay rubric is stored in the content of the option with key ESSAY
                    const essayOpt = (q.options || []).find((o: any) => o.option_key === 'ESSAY');
                    setEssayKeywords(essayOpt ? essayOpt.content : (typeof q.key_answer?.rubric === 'string' ? q.key_answer.rubric : ''));
                } else if (q.question_type === 'math_input') {
                    const answer = q.key_answer?.answer || q.key_answer;
                    const mathOpt = (q.options || []).find((o: any) => o.option_key === 'MATH');
                    setMathContent(mathOpt ? mathOpt.content : (typeof answer === 'string' ? answer : ''));
                } else if (q.question_type === 'arabic_response') {
                    const araOpt = (q.options || []).find((o: any) => o.option_key === 'ARABIC');
                    setArabicContent(araOpt ? araOpt.content : ((q.key_answer?.answers || [])[0] || ''));
                } else if (q.question_type === 'javanese_response') {
                    const javOpt = (q.options || []).find((o: any) => o.option_key === 'JAVANESE');
                    setJavaneseContent(javOpt ? javOpt.content : ((q.key_answer?.answers || [])[0] || ''));
                } else if (q.question_type === 'categorization') {
                    const groupsMap = new Map();
                    // Options in snapshot contain the item content and their category metadata
                    (q.options || []).forEach((o: any) => {
                        const title = o.metadata?.group_title || o.metadata?.category_title || 'Other';
                        const groupUuid = o.metadata?.group_uuid || generateUUID();

                        if (!groupsMap.has(title)) {
                            groupsMap.set(title, {
                                uuid: groupUuid,
                                title,
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

                    // Fallback to key_answer groups if options don't have metadata
                    if (groupsMap.size === 0 && q.key_answer?.groups) {
                        q.key_answer.groups.forEach((kg: any) => {
                            const groupUuid = generateUUID();
                            groupsMap.set(kg.title, {
                                uuid: groupUuid,
                                title: kg.title,
                                items: kg.items.map((itemKey: string) => {
                                    const opt = (q.options || []).find((o: any) => o.option_key === itemKey);
                                    return {
                                        id: opt?.id,
                                        uuid: opt?.id || generateUUID(),
                                        content: opt?.content || itemKey,
                                        media: opt?.media?.option_media?.[0] || null
                                    };
                                })
                            });
                        });
                    }

                    setCategorizationGroups(Array.from(groupsMap.values()));
                } else if (q.question_type === 'arrange_words') {
                    setArrangeWordsSentence(q.key_answer?.words?.join(q.key_answer?.delimiter || ' ') || '');
                    const sentOpt = (q.options || []).find((o: any) => o.option_key === 'SENTENCE');
                    if (sentOpt) {
                        setArrangeWordsDelimiter(sentOpt.metadata?.delimiter || ' ');
                        setArrangeWordsIsArabic(!!sentOpt.metadata?.is_arabic);
                        setArrangeWordsShuffleMode(sentOpt.metadata?.shuffle_mode || 'phrase');
                    }
                }

                setIsQuestionLoading(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [currentQuestion]);

    const handleSave = async () => {
        if (!currentQuestion) return;

        setIsSaving(true);
        try {
            // Reconstruct data based on type
            const updatePayload: any = {
                id: currentQuestion.id,
                content,
                score_value: score,
                question_type: type,
            };

            if (['multiple_choice', 'multiple_selection', 'true_false', 'short_answer'].includes(type)) {
                updatePayload.options = options.map((opt, idx) => ({
                    id: opt.id,
                    option_key: opt.key || (type === 'short_answer' ? `SA${idx + 1}` : String.fromCharCode(65 + idx)),
                    content: opt.content,
                    is_correct: opt.is_correct ? 1 : 0
                }));

                if (type === 'multiple_choice' || type === 'true_false') {
                    const correct = options.find((o: any) => o.is_correct);
                    updatePayload.key_answer = { answer: correct ? correct.key : '' };
                } else if (type === 'multiple_selection') {
                    updatePayload.key_answer = { answers: options.filter((o: any) => o.is_correct).map((o: any) => o.key) };
                } else if (type === 'short_answer') {
                    updatePayload.key_answer = { answers: options.filter((o: any) => o.is_correct).map((o: any) => o.content) };
                }
            } else if (type === 'matching') {
                updatePayload.options = [];
                const keyPairs: any = {};
                matchingPairs.forEach((p, idx) => {
                    const leftKey = `L${idx + 1}`;
                    const rightKey = `R${idx + 1}`;
                    updatePayload.options.push(
                        { option_key: leftKey, content: p.left, metadata: { side: 'left', pair_id: idx + 1, match_with: rightKey } },
                        { option_key: rightKey, content: p.right, metadata: { side: 'right', pair_id: idx + 1, match_with: leftKey } }
                    );
                    keyPairs[leftKey] = rightKey;
                });
                updatePayload.key_answer = { pairs: keyPairs };
            } else if (type === 'sequence') {
                updatePayload.options = sequenceItems.map((item: any, idx: number) => ({
                    option_key: (idx + 1).toString(),
                    content: item.content,
                    order: idx + 1,
                    metadata: { correct_position: idx + 1 }
                }));
                updatePayload.key_answer = { order: updatePayload.options.map((o: any) => o.option_key) };
            } else if (type === 'essay') {
                updatePayload.options = [{ option_key: 'ESSAY', content: essayKeywords, is_correct: true, metadata: { type: 'rubric' } }];
                updatePayload.key_answer = { rubric: essayKeywords };
            } else if (type === 'math_input') {
                updatePayload.options = [{ option_key: 'MATH', content: mathContent, is_correct: true, metadata: { correct_answer: mathContent } }];
                updatePayload.key_answer = { answer: mathContent };
            } else if (type === 'arabic_response') {
                updatePayload.options = [{ option_key: 'ARABIC', content: arabicContent, is_correct: true, metadata: { correct_answer: arabicContent } }];
                updatePayload.key_answer = { answers: [arabicContent] };
            } else if (type === 'javanese_response') {
                updatePayload.options = [{ option_key: 'JAVANESE', content: javaneseContent, is_correct: true, metadata: { correct_answer: javaneseContent } }];
                updatePayload.key_answer = { answers: [javaneseContent] };
            } else if (type === 'categorization') {
                updatePayload.options = [];
                const groups: any[] = [];
                categorizationGroups.forEach((group, gIdx) => {
                    const itemKeys: string[] = [];
                    const groupUuid = group.uuid || generateUUID();
                    group.items.forEach((item: any, iIdx: number) => {
                        const key = `C${gIdx + 1}I${iIdx + 1}`;
                        updatePayload.options.push({
                            option_key: key,
                            content: item.content,
                            is_correct: true,
                            metadata: {
                                group_uuid: groupUuid,
                                group_title: group.title,
                                category_title: group.title // Both for compatibility
                            }
                        });
                        itemKeys.push(key);
                    });
                    groups.push({ title: group.title, items: itemKeys });
                });
                updatePayload.key_answer = { groups };
            } else if (type === 'arrange_words') {
                updatePayload.options = [{
                    option_key: 'SENTENCE',
                    content: arrangeWordsSentence,
                    metadata: {
                        delimiter: arrangeWordsDelimiter,
                        is_arabic: arrangeWordsIsArabic,
                        shuffle_mode: arrangeWordsShuffleMode
                    }
                }];
                updatePayload.key_answer = {
                    words: arrangeWordsShuffleMode === 'alphabet'
                        ? arrangeWordsSentence.replace(/\s/g, '').split('')
                        : arrangeWordsSentence.split(arrangeWordsDelimiter || ' ')
                };
            }

            const response = await examQuestionApi.updateExamQuestion(currentQuestion.id, updatePayload);
            if (response.success) {
                Swal.fire({
                    title: 'Berhasil Disimpan',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success'
                });
                onUpdate();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan perubahan', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOptionMedia = (uuid: string) => {
        // Since we are editing ExamQuestion which might not have separate media API like original questions,
        // we just clear it from the state. Actual server-side deletion would normally happen on save or via separate endpoint.
        setOptions(prev => prev.map(o => o.uuid === uuid ? { ...o, media: null } : o));
    };

    const renderQuestionTypeIcon = (type: string) => {
        switch (type) {
            case 'multiple_choice': return <ListTodo className="w-4 h-4" />;
            case 'multiple_selection': return <CheckSquare className="w-4 h-4" />;
            case 'true_false': return <ArrowUpDown className="w-4 h-4" />;
            case 'short_answer': return <Type className="w-4 h-4" />;
            case 'essay': return <AlignLeft className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    if (!currentQuestion) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Pilih soal untuk mulai mengelola</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex overflow-hidden bg-slate-50 dark:bg-background-dark font-lexend">
            {/* Sidebar Daftar Soal */}
            <aside className="w-[300px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daftar Soal</h2>
                        <span className="text-[10px] font-bold text-slate-400">{initialQuestions.length} Soal</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="w-full pl-8 py-1.5 text-xs border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Cari konten soal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {initialQuestions
                        .filter((q, idx) => {
                            const content = q.content || q.question_content || '';
                            return content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                `Soal ${idx + 1}`.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setSelectedQuestionIndex(index)}
                                className={cn(
                                    "w-full p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-left transition-all",
                                    selectedQuestionIndex === index ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <span className={cn(
                                    "flex-shrink-0 w-8 h-8 rounded-xl text-[10px] font-bold flex items-center justify-center",
                                    selectedQuestionIndex === index ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                )}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="flex-grow overflow-hidden text-left flex flex-col items-start gap-0.5">
                                    <p
                                        className={cn(
                                            "text-xs truncate w-full",
                                            selectedQuestionIndex === index ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-500"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: (q.content || q.question_content || '').replace(/<[^>]*>/g, '') || `Soal ${index + 1}` }}
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <div className="text-slate-400">
                                            {renderQuestionTypeIcon(q.question_type)}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {q.question_type.replace(/_/g, ' ')}
                                        </p>
                                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {q.score_value || q.score} Pts
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                </div>
            </aside>

            {/* Main Content Form */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            {renderQuestionTypeIcon(type || '')}
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Kelola Soal #{selectedQuestionIndex + 1}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{type?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isQuestionLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Simpan Perubahan
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/30 dark:bg-background-dark/30">
                    {isQuestionLoading ? (
                        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-64 w-full rounded-2xl" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-32 w-full rounded-2xl" />
                                <Skeleton className="h-32 w-full rounded-2xl" />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-10">
                            {/* Question Content */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-500">
                                            <AlignLeft className="w-4 h-4" />
                                        </div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Konten Soal
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <QuestionToolbar />
                                        <div className="flex flex-col items-end justify-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Point Score</span>
                                            <QuestionScoreSelector
                                                initialScore={score}
                                                onScoreChange={setScore}
                                                manual={true}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                    <RichTextEditor
                                        value={content}
                                        onChange={setContent}
                                        minHeight="min-h-[200px]"
                                        className="p-4"
                                    />
                                </div>
                            </section>

                            {/* Question Inputs (Options, etc.) */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 px-1 mb-2">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500">
                                        <Layout className="w-4 h-4" />
                                    </div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Konfigurasi Jawaban
                                    </label>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
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
                                        arrangeWordsSentence={arrangeWordsSentence}
                                        setArrangeWordsSentence={setArrangeWordsSentence}
                                        arrangeWordsDelimiter={arrangeWordsDelimiter}
                                        setArrangeWordsDelimiter={setArrangeWordsDelimiter}
                                        arrangeWordsIsArabic={arrangeWordsIsArabic}
                                        setArrangeWordsIsArabic={setArrangeWordsIsArabic}
                                        arrangeWordsShuffleMode={arrangeWordsShuffleMode}
                                        setArrangeWordsShuffleMode={setArrangeWordsShuffleMode}
                                        isEditing={true}
                                    />
                                </div>
                            </section>

                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Perhatian</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                                        Perubahan pada soal ujian ini bersifat lokal untuk ujian ini saja.
                                        Soal di Bank Soal tidak akan terpengaruh. Pastikan kunci jawaban sudah benar sesuai tipe soal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
