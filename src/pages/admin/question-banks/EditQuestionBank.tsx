import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { questionBankApi, questionApi, QuestionBank, Question } from '@/lib/api';
import Swal from 'sweetalert2';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import QuestionDifficultySelector from '@/components/questions/QuestionDifficultySelector';
import QuestionTimerSelector from '@/components/questions/QuestionTimerSelector';
import QuestionScoreSelector from '@/components/questions/QuestionScoreSelector';
import QuestionTypeSelector from '@/components/questions/QuestionTypeSelector';
import QuestionOptionDisplay from '@/components/questions/displays/QuestionOptionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';
import QuestionBankSettingsModal from '@/components/admin/question-banks/QuestionBankSettingsModal';
import MediaModal from '@/components/questions/MediaModal';

export default function EditQuestionBank() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingBank, setIsLoadingBank] = useState(true);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const fetchBank = async () => {
        if (!id) return;
        setIsLoadingBank(true);
        try {
            const response = await questionBankApi.getQuestionBank(id);
            if (response.success) {
                setBank(response.data);
                // Use questions from the bank response
                if (response.data.questions) {
                    setQuestions(response.data.questions);
                    setTotalQuestions(response.data.questions.length);
                }
            } else {
                Swal.fire('Error', response.message, 'error');
                navigate('/admin/question-banks');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to load question bank', 'error');
            navigate('/admin/question-banks');
        } finally {
            setIsLoadingBank(false);
        }
    };

    useEffect(() => {
        fetchBank();
    }, [id]);

    // Scroll to highlighted question if passed in state
    useEffect(() => {
        if (!isLoadingBank && location.state?.highlightQuestionId && questions.length > 0) {
            const highlightId = location.state.highlightQuestionId as string;
            // Check if question is in current list
            const questionIndex = questions.findIndex(q => q.id === highlightId);

            if (questionIndex !== -1) {
                // Determine if we need to wait for render (useRef callback) or if ref is ready
                // Since this runs on questions change, refs might be updated in next tick
                setTimeout(() => {
                    const element = questionRefs.current[highlightId];
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                        setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000);

                        // Clear state to prevent re-scroll
                        navigate(location.pathname, { replace: true, state: {} });
                    }
                }, 100);
            }
        }
    }, [questions, location.state, navigate, location.pathname, isLoadingBank]);

    const scrollToQuestion = async (index: number) => {
        const targetQuestion = questions[index];
        if (targetQuestion) {
            const element = questionRefs.current[targetQuestion.id];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Real implementation would be complex: verify total, calc page, fetch pages seq.
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Question not loaded yet. Scroll down to load more.',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        const result = await Swal.fire({
            title: 'Delete Question?',
            text: "This cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await questionApi.deleteQuestion(questionId);
                setQuestions(prev => prev.filter(q => q.id !== questionId));
                setTotalQuestions(prev => prev - 1);
                Swal.fire('Deleted!', 'Question has been deleted.', 'success');
            } catch (error) {
                console.error("Failed to delete question", error);
                Swal.fire('Error', 'Failed to delete question', 'error');
            }
        }
    };

    if (isLoadingBank && !bank) {
        return (
            <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased h-screen flex flex-col">
                <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 max-w-xl space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-28 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                        <Skeleton className="size-10 rounded-full" />
                    </div>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-background-dark/30">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <div className="space-y-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    </main>
                    <aside className="w-80 bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 flex-col h-full shrink-0 hidden lg:flex">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <Skeleton className="h-4 w-40 mb-4" />
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-4 gap-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="size-12 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    if (!bank) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased h-screen flex flex-col font-display">
            {/* Header */}
            <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => navigate('/admin/question-banks')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1 max-w-xl">
                        {/* Editable Title Implementation could go here */}
                        <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{bank.name}</div>
                        <p className="text-xs text-slate-400 font-medium">
                            {(bank as any).subject?.name} • {(bank as any).subject?.code}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </button>
                    <Link to={`/admin/question-banks/${id}/show`} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">quiz</span>
                        Exam
                    </Link>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5">
                        <img
                            alt="Profile"
                            className="rounded-full size-full object-cover"
                            src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                        />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-background-dark/30 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                        {/* AI Generator Mock */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-primary/20 p-6 flex items-center gap-4">
                            <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">Generate Question by AI</label>
                                <div className="relative">
                                    <input
                                        className="w-full pl-4 pr-32 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all outline-none"
                                        placeholder="Describe the topic or paste text to generate questions... (Coming Soon)"
                                        type="text"
                                        disabled
                                    />
                                    <button disabled className="absolute right-2 top-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Question List */}
                        <div className="space-y-6">
                            {questions.map((question, index) => {
                                return (
                                    <div
                                        key={question.id}
                                        ref={(el) => {
                                            questionRefs.current[question.id] = el;
                                        }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 group"
                                    >
                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start rounded-t-2xl">
                                            <div className="flex gap-4 items-center">
                                                <span className="size-8 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </span>
                                                <QuestionTypeSelector
                                                    questionId={question.id}
                                                    initialType={question.type}
                                                    disabled={true}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/questions/${question.id}/edit`)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Edit Question"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Delete Question"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                                            {/* Badge Stats */}
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-slate-400 text-sm">bar_chart</span>
                                                <QuestionDifficultySelector
                                                    questionId={question.id}
                                                    initialDifficulty={question.difficulty}
                                                    onDifficultyChange={(newDifficulty) => {
                                                        // Optimistically update the list locally to reflect changes if needed elsewhere, 
                                                        // though the selector manages its own state for the dropdown itself.
                                                        setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, difficulty: newDifficulty } : q));
                                                    }}
                                                />
                                            </div>
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                            <QuestionTimerSelector
                                                questionId={question.id}
                                                initialTimer={question.timer}
                                                onTimerChange={(newTimer) => {
                                                    setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, timer: newTimer } : q));
                                                }}
                                            />
                                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                            <QuestionScoreSelector
                                                questionId={question.id}
                                                initialScore={question.score}
                                                onScoreChange={(newScore) => {
                                                    setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, score: newScore } : q));
                                                }}
                                            />
                                        </div>

                                        <div className="p-6 rounded-b-2xl">
                                            <div className="flex gap-6 mb-6">
                                                <MathRenderer
                                                    className="flex-1 font-semibold text-slate-800 dark:text-slate-100 leading-relaxed"
                                                    content={question.content}
                                                />
                                                {question.media?.content?.[0] && (
                                                    <div
                                                        onClick={() => setPreviewImageUrl(question.media?.content?.[0].url || null)}
                                                        className="size-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in hover:border-primary/50 transition-all shadow-sm"
                                                    >
                                                        <img
                                                            src={question.media.content[0].url}
                                                            alt="Question"
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Options */}
                                            <div className="mt-6">
                                                <QuestionOptionDisplay
                                                    question={question}
                                                    onMediaClick={(url) => setPreviewImageUrl(url)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}




                            {questions.length === 0 && (
                                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <span className="material-symbols-outlined text-3xl">library_add</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Questions Yet</h3>
                                    <p className="text-slate-500 text-sm mb-6">Start adding questions to this bank.</p>
                                </div>
                            )}
                        </div>

                        {/* Add New Button */}
                        <button
                            onClick={() => navigate(`/admin/question-banks/${id}/questions/create`)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 mb-12"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Add New Question
                        </button>
                    </div>
                </main>

                {/* Right Sidebar - Question Navigator */}
                <aside className="w-80 bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] shrink-0 hidden lg:flex">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Question Navigator</h4>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                            <span>Total: {totalQuestions} Questions</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold">{questions.length} Loaded</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: totalQuestions }).map((_, i) => {
                                const isLoaded = i < questions.length;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => scrollToQuestion(i)}
                                        className={`size-12 rounded-xl font-bold text-sm border border-transparent transition-all ${isLoaded
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary'
                                            : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 cursor-not-allowed' // Visual cue
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => navigate(`/admin/question-banks/${id}/questions/create`)}
                                className="size-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            <QuestionBankSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                bank={bank}
                onSaved={(updatedBank) => {
                    setBank(updatedBank);
                }}
            />
            <MediaModal
                isOpen={!!previewImageUrl}
                onClose={() => setPreviewImageUrl(null)}
                imageUrl={previewImageUrl}
                readOnly={true}
            />
        </div>
    );
}
