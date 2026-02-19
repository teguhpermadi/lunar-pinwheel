import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { questionApi } from '@/lib/api';
import QuestionFormLayout from '@/components/questions/QuestionFormLayout';
import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';
import TrueFalseInput from '@/components/questions/inputs/TrueFalseInput';
import MatchingInput from '@/components/questions/inputs/MatchingInput';
import SequenceInput from '@/components/questions/inputs/SequenceInput';
import EssayInput from '@/components/questions/inputs/EssayInput';

export default function EditQuestionPage() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Core Question State
    const [type, setType] = useState('multiple_choice');
    const [difficulty, setDifficulty] = useState('mudah');
    const [timer, setTimer] = useState(60000);
    const [score, setScore] = useState(5);
    const [content, setContent] = useState('');
    const [hint, setHint] = useState('');
    const [bankId, setBankId] = useState<string | null>(null);

    // Specific Input States
    const [options, setOptions] = useState<any[]>([]);
    const [matchingPairs, setMatchingPairs] = useState<any[]>([]);
    const [sequenceItems, setSequenceItems] = useState<any[]>([]);
    const [essayKeywords, setEssayKeywords] = useState('');

    useEffect(() => {
        fetchQuestion();
    }, [questionId]);

    const fetchQuestion = async () => {
        if (!questionId) return;
        setIsLoading(true);
        try {
            // Assuming createQuestion endpoint exists based on earlier check
            const response = await questionApi.getQuestion(questionId);

            if (response.success) {
                const q = response.data;
                setType(q.type);
                setDifficulty(q.difficulty);
                setTimer(q.timer);
                setScore(q.score);
                setScore(q.score);
                setContent(q.content);
                setBankId(q.question_bank_id);
                // setHint(q.hint); // If hint exists

                // Map options/data based on type
                if (['multiple_choice', 'multiple_selection', 'true_false'].includes(q.type)) {
                    // Map existing options
                    setOptions(q.options.map((o: any) => ({
                        ...o,
                        key: o.option_key,
                        uuid: o.id || crypto.randomUUID() // Use ID as UUID for existing
                    })));
                } else if (q.type === 'matching') {
                    // Need to map matching pairs. 
                    // IMPORTANT: Adjust this mapping based on ACTUAL API response structure for matching questions.
                    // For now assuming a generic structure or re-using options if backend does that.
                    // If backend returns `options` with `content` and `match_content`?
                    // Placeholder mapping:
                    // setMatchingPairs(...)
                } else if (q.type === 'sequence') {
                    // setSequenceItems(...)
                }
                // Essay keywords...
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

    const handleSave = async () => {
        if (!content.trim()) {
            Swal.fire('Error', 'Question text is required', 'error');
            return;
        }

        setIsSaving(true);

        try {
            let finalOptions: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let extendedData = {};

            switch (type) {
                case 'multiple_choice':
                case 'multiple_selection':
                case 'true_false':
                    finalOptions = options.map((opt, idx) => ({
                        id: opt.id, // Include ID for updates
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
                            id: p.id,
                            left: p.left,
                            right: p.right
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

            if (Object.keys(extendedData).length > 0) {
                Object.assign(payload, extendedData);
            }

            const response = await questionApi.updateQuestion(questionId!, payload);

            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Question Updated',
                    showConfirmButton: false,
                    timer: 1500
                });

                if (bankId) {
                    navigate(`/admin/question-banks/${bankId}`, {
                        state: {
                            highlightQuestionId: questionId,
                            action: 'updated'
                        }
                    });
                } else {
                    navigate(-1);
                }
            } else {
                throw new Error(response.message || 'Failed to update question');
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
            title="Edit Question"
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
            isEditing={true}
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
                <MultipleChoiceInput options={options} onChange={setOptions} />
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