import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionBankApi, QuestionBank, Question } from '@/lib/api';
import Swal from 'sweetalert2';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import QuestionDifficultySelector from '@/components/questions/QuestionDifficultySelector';
import QuestionTimerSelector from '@/components/questions/QuestionTimerSelector';
import QuestionScoreSelector from '@/components/questions/QuestionScoreSelector';
import QuestionTypeSelector from '@/components/questions/QuestionTypeSelector';
import QuestionOptionDisplay from '@/components/questions/displays/QuestionOptionDisplay';

export default function ShowQuestionBank() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const response = await questionBankApi.getQuestionBank(id);
                if (response.success) {
                    setBank(response.data);
                    // Use questions from the bank response (includes options relation)
                    if (response.data.questions) {
                        setQuestions(response.data.questions);
                    }
                } else {
                    Swal.fire('Error', 'Failed to load Question Bank', 'error');
                    navigate('/admin/question-banks');
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                Swal.fire('Error', 'Failed to load data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
                <header className="h-20 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 p-8 space-y-6">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </main>
                    <aside className="w-[400px] border-l border-slate-200 dark:border-slate-800 p-6">
                        <Skeleton className="h-full w-full" />
                    </aside>
                </div>
            </div>
        );
    }

    if (!bank) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased overflow-hidden h-screen flex flex-col font-display">
            {/* Header */}
            <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0 no-print">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => navigate('/admin/question-banks')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1 max-w-xl">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{bank.name}</h1>
                        <p className="text-xs text-slate-400 font-medium">
                            {(bank as any).subject?.name} • {(bank as any).subject?.code} • {questions.length} Questions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">print</span>
                        Print Questions
                    </button>
                    <button
                        onClick={() => navigate(`/admin/question-banks/${id}`)}
                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Question Bank
                    </button>
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
                {/* Main Content - Question List */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark/30 scroll-smooth relative print-full-width no-scrollbar">
                    <div className="max-w-4xl mx-auto p-8 space-y-8 pb-10 print-full-width">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 break-inside-avoid"
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
                                </div>

                                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">bar_chart</span>
                                        <QuestionDifficultySelector
                                            questionId={question.id}
                                            initialDifficulty={question.difficulty}
                                            disabled={true}
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                    <QuestionTimerSelector
                                        questionId={question.id}
                                        initialTimer={question.timer}
                                        disabled={true}
                                    />
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                                    <QuestionScoreSelector
                                        questionId={question.id}
                                        initialScore={question.score}
                                        disabled={true}
                                    />
                                </div>

                                <div className="p-6 rounded-b-2xl">
                                    <div
                                        className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed mb-6"
                                        dangerouslySetInnerHTML={{ __html: question.content }}
                                    />
                                    <div className="mt-6">
                                        <QuestionOptionDisplay question={question} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Sidebar - Exam Setup */}
                <aside className="w-[400px] bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 no-print overflow-hidden hidden lg:flex">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-primary text-xl">settings</span>
                            Comprehensive Exam Setup
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">CONFIGURE EXAM PARAMETERS</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exam Title</label>
                                        <input className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary" placeholder="Enter title..." type="text" defaultValue={bank.name} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                            <select className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary">
                                                <option>UTS (Mid-Term)</option>
                                                <option>UAS (Final)</option>
                                                <option>Daily Quiz</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passing Score</label>
                                            <input className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary" type="number" defaultValue="75" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">security</span>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security & Randomization</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Exam Token</span>
                                            <span className="text-[10px] text-slate-400">Require code to enter</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input className="w-20 text-xs font-mono font-bold bg-white dark:bg-slate-800 border-none rounded p-1 text-center text-primary" type="text" defaultValue="XJ92K" readOnly />
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/30 transition-colors">
                                        <input defaultChecked className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" />
                                        <span className="text-[10px] font-bold leading-tight">Randomize Questions</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/30 transition-colors">
                                        <input defaultChecked className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" />
                                        <span className="text-[10px] font-bold leading-tight">Randomize Answers</span>
                                    </label>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduling & Logic</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (Min)</label>
                                            <input className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary" type="number" defaultValue="90" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Attempts</label>
                                            <input className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary" placeholder="Unlimited" type="number" defaultValue="1" />
                                        </div>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input defaultChecked className="rounded text-primary focus:ring-primary border-slate-300" type="checkbox" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Is Published</span>
                                        </label>
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <button className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">
                                Finalize Exam
                            </button>
                            <button className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-xs font-bold hover:bg-white transition-all">
                                Draft
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
