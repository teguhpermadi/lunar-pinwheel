import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionBankApi, examApi, QuestionBank, Question } from '@/lib/api';
import Swal from 'sweetalert2';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import QuestionDifficultySelector from '@/components/questions/QuestionDifficultySelector';
import QuestionTimerSelector from '@/components/questions/QuestionTimerSelector';
import QuestionScoreSelector from '@/components/questions/QuestionScoreSelector';
import QuestionTypeSelector from '@/components/questions/QuestionTypeSelector';
import QuestionOptionDisplay from '@/components/questions/displays/QuestionOptionDisplay';
import MathRenderer from '@/components/ui/MathRenderer';

interface ToggleProps {
    label: string;
    hint?: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: string;
}

const Toggle = ({ label, hint, description, checked, onChange, icon }: ToggleProps) => (
    <div className="flex flex-col gap-1.5 group">
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="size-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-100 dark:border-slate-700">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{label}</span>
                    {description && <span className="text-[9px] text-slate-400 font-medium">{description}</span>}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}
                />
            </button>
        </div>
        {hint && <p className="text-[9px] text-slate-400 ml-1 px-1">{hint}</p>}
    </div>
);

export default function ShowQuestionBank() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedYearId } = useAcademicYear();
    const [bank, setBank] = useState<QuestionBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'daily',
        passing_score: 75,
        duration: 90,
        max_attempts: 1,
        is_published: true,
        is_randomized_question: true,
        is_randomized_answer: true,
        timer_type: 'flexible',
        token: '',
        is_token_visible: true,
        is_show_result: true,
        is_visible_hint: false,
        start_time: new Date().toISOString().slice(0, 16),
        end_time: ''
    });

    useEffect(() => {
        if (bank) {
            setFormData(prev => ({ ...prev, title: bank.name }));
        }
    }, [bank]);

    const handleFinalizeExam = async () => {
        if (!bank || !id) return;
        if (!selectedYearId || !user?.id) {
            Swal.fire('Error', 'Academic Year or User not identified', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                academic_year_id: selectedYearId,
                subject_id: bank.subject_id,
                user_id: user.id,
                question_bank_id: id,
                title: formData.title,
                type: formData.type,
                duration: formData.duration,
                passing_score: formData.passing_score,
                max_attempts: formData.max_attempts === 0 ? null : formData.max_attempts,
                is_published: formData.is_published,
                is_randomized_question: formData.is_randomized_question,
                is_randomized_answer: formData.is_randomized_answer,
                timer_type: formData.timer_type,
                token: null, // Backend will generate automatically
                is_token_visible: formData.is_token_visible,
                is_show_result: formData.is_show_result,
                is_visible_hint: formData.is_visible_hint,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
            };

            const response = await examApi.createExam(payload);
            if (response.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Exam has been finalized and created.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                // navigate to exam live score
                navigate(`/admin/exams/${response.data.id}/live`);
            } else {
                Swal.fire('Error', response.message || 'Failed to create exam', 'error');
            }
        } catch (error: any) {
            console.error("Failed to create exam", error);
            const errorMessage = error.response?.data?.message || 'Something went wrong';
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    <MathRenderer
                                        className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed mb-6"
                                        content={question.content}
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
                                        <input
                                            className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary"
                                            placeholder="Enter title..."
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                                            <select
                                                className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="midterm">UTS (Mid-Term)</option>
                                                <option value="final">UAS (Final)</option>
                                                <option value="daily">Daily Quiz</option>
                                                <option value="tryout">Tryout</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passing Score</label>
                                            <input
                                                className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary"
                                                type="number"
                                                value={formData.passing_score}
                                                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">security</span>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settings & Logic</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <Toggle
                                        label="Show Token"
                                        hint="Display the computer-generated access token to students"
                                        icon="key"
                                        checked={formData.is_token_visible}
                                        onChange={(checked) => setFormData({ ...formData, is_token_visible: checked })}
                                    />
                                    <Toggle
                                        label="Randomize Questions"
                                        hint="Mix question order"
                                        icon="shuffle"
                                        checked={formData.is_randomized_question}
                                        onChange={(checked) => setFormData({ ...formData, is_randomized_question: checked })}
                                    />
                                    <Toggle
                                        label="Randomize Options"
                                        hint="Mix answer options"
                                        icon="reorder"
                                        checked={formData.is_randomized_answer}
                                        onChange={(checked) => setFormData({ ...formData, is_randomized_answer: checked })}
                                    />
                                    <Toggle
                                        label="Show Result"
                                        hint="Show score after finish"
                                        icon="visibility"
                                        checked={formData.is_show_result}
                                        onChange={(checked) => setFormData({ ...formData, is_show_result: checked })}
                                    />
                                    <Toggle
                                        label="Visible Hint"
                                        hint="Enable help icons"
                                        icon="lightbulb"
                                        checked={formData.is_visible_hint}
                                        onChange={(checked) => setFormData({ ...formData, is_visible_hint: checked })}
                                    />
                                    <Toggle
                                        label="Publish Immediately"
                                        hint="Make exam live for students"
                                        icon="rocket_launch"
                                        checked={formData.is_published}
                                        onChange={(checked) => setFormData({ ...formData, is_published: checked })}
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduling & Logic</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (Min)</label>
                                            <input
                                                className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary"
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Max Attempts</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, max_attempts: formData.max_attempts === 0 ? 1 : 0 })}
                                                    className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition-all duration-300 ${formData.max_attempts === 0 ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}
                                                >
                                                    <span className="material-symbols-outlined text-[12px] leading-none">all_inclusive</span>
                                                    {formData.max_attempts === 0 ? 'Unlimited Active' : 'Set Unlimited'}
                                                </button>
                                            </div>
                                            <div className="relative group/attempt">
                                                <input
                                                    className={`w-full text-sm rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary px-3 py-2.5 transition-all ${formData.max_attempts === 0 ? 'text-primary/50 border-primary/20 bg-primary/[0.02]' : ''}`}
                                                    placeholder={formData.max_attempts === 0 ? "" : "Enter number..."}
                                                    type="number"
                                                    disabled={formData.max_attempts === 0}
                                                    value={formData.max_attempts === 0 ? '' : formData.max_attempts}
                                                    onChange={(e) => setFormData({ ...formData, max_attempts: Math.max(1, parseInt(e.target.value) || 1) })}
                                                />
                                                {formData.max_attempts === 0 && (
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none animate-in fade-in zoom-in-95 duration-300">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-primary text-lg">all_inclusive</span>
                                                            <span className="text-sm font-bold text-primary/60 italic tracking-tight">Unlimited Retakes</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`absolute right-3 inset-y-0 flex items-center text-slate-300 transition-opacity duration-300 ${formData.max_attempts === 0 ? 'opacity-0' : 'opacity-100'}`}>
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Timer Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, timer_type: 'flexible' })}
                                                    className={`px-3 py-2.5 text-[10px] font-bold uppercase rounded-xl border transition-all ${formData.timer_type === 'flexible' ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 shadow-sm'}`}
                                                >
                                                    Flexible
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, timer_type: 'strict' })}
                                                    className={`px-3 py-2.5 text-[10px] font-bold uppercase rounded-xl border transition-all ${formData.timer_type === 'strict' ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 shadow-sm'}`}
                                                >
                                                    Strict
                                                </button>
                                            </div>
                                            <p className="mt-2 text-[9px] text-slate-400 font-medium leading-relaxed px-1">
                                                {formData.timer_type === 'flexible'
                                                    ? "Students can leave and return. The timer only counts down while the student is active."
                                                    : "The timer keeps running even if the student leaves. Exam ends automatically when time is up."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Starts At</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary px-3 py-2"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Ends At</label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { label: '1 Day', days: 1 },
                                                        { label: '2 Days', days: 2 },
                                                        { label: '1 Week', days: 7 }
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const start = formData.start_time ? new Date(formData.start_time) : new Date();
                                                                const end = new Date(start.getTime() + preset.days * 24 * 60 * 60 * 1000);
                                                                setFormData({ ...formData, end_time: end.toISOString().slice(0, 16) });
                                                            }}
                                                            className="px-3 py-1.5 text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                                                        >
                                                            +{preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input
                                                type="datetime-local"
                                                className="w-full text-sm rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary px-3 py-2"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleFinalizeExam}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : 'Finalize Exam'}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
