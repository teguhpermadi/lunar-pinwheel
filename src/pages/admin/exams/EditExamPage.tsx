import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';

type Tab = 'general' | 'behavior' | 'scheduling';

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

export default function EditExamPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchExam = async () => {
            if (!id) return;
            try {
                const response = await examApi.getExam(id);
                if (response.success) {
                    setExam(response.data);
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
                Swal.fire('Error', 'Failed to fetch exam details', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchExam();
    }, [id]);

    const handleSave = async () => {
        if (!id || !exam) return;
        setIsSaving(true);
        try {
            const response = await examApi.updateExam(id, exam);
            if (response.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Exam configuration updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', response.message || 'Failed to update exam', 'error');
            }
        } catch (error: any) {
            console.error('Error updating exam:', error);
            const errorMessage = error.response?.data?.message || 'Something went wrong';
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLiveScore = () => {
        if (!id) return;
        navigate(`/admin/exams/${id}/live`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-background-dark/30 animate-pulse">
                <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-64" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 p-8">
                        <Skeleton className="h-full w-full rounded-2xl" />
                    </main>
                    <aside className="w-80 p-8 border-l border-slate-200 dark:border-slate-800">
                        <Skeleton className="h-full w-full rounded-2xl" />
                    </aside>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => navigate('/admin/exams')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1 max-w-xl">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                            {exam.title}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">
                            {exam.subject?.name} • {exam.academic_year?.year} • Configuration Hub
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLiveScore}
                        className="px-5 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-2 group/live"
                    >
                        <span className="material-symbols-outlined text-lg animate-pulse">scoreboard</span>
                        Live Score
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isSaving ? 'sync' : 'save'}
                        </span>
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5">
                        <img
                            alt="Admin"
                            className="rounded-full size-full object-cover"
                            src={`https://ui-avatars.com/api/?name=${exam.user?.name || 'Admin'}&background=random`}
                        />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark/30 relative scrollbar-hide">
                    <div className="max-w-3xl mx-auto p-8 space-y-8">
                        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
                            {[
                                { id: 'general', icon: 'settings', label: 'General Settings' },
                                { id: 'behavior', icon: 'psychology', label: 'Question Behavior' },
                                { id: 'scheduling', icon: 'calendar_month', label: 'Scheduling & Security' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={cn(
                                        "pb-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all",
                                        activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identity & Purpose</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exam Title</label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-primary focus:border-primary outline-none transition-all"
                                                    placeholder="Enter title..."
                                                    type="text"
                                                    value={exam.title}
                                                    onChange={(e) => setExam(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exam Type</label>
                                                    <select
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                                                        value={exam.type}
                                                        onChange={(e) => setExam(prev => prev ? { ...prev, type: e.target.value } : null)}
                                                    >
                                                        <option value="daily">Daily Quiz</option>
                                                        <option value="midterm">UTS (Mid-Term)</option>
                                                        <option value="final">UAS (Final)</option>
                                                        <option value="tryout">Tryout</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passing Score</label>
                                                    <input
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                                                        type="number"
                                                        value={exam.passing_score}
                                                        onChange={(e) => setExam(prev => prev ? { ...prev, passing_score: parseInt(e.target.value) || 0 } : null)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'behavior' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">shuffle</span>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logic & Randomization</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Toggle
                                                label="Randomize Questions"
                                                description="Shuffle question order for each student"
                                                icon="shuffle"
                                                checked={exam.is_randomized_question}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_randomized_question: val } : null)}
                                            />
                                            <Toggle
                                                label="Randomize Options"
                                                description="Shuffle answer choices within questions"
                                                icon="reorder"
                                                checked={exam.is_randomized_answer}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_randomized_answer: val } : null)}
                                            />
                                            <Toggle
                                                label="Show Result"
                                                description="Show final score to students after finish"
                                                icon="visibility"
                                                checked={exam.is_show_result}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_show_result: val } : null)}
                                            />
                                            <Toggle
                                                label="Visible Hint"
                                                description="Allow students to view question hints"
                                                icon="lightbulb"
                                                checked={exam.is_visible_hint}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_visible_hint: val } : null)}
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'scheduling' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execution Hub</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Duration (Minutes)</label>
                                                    <input
                                                        className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary px-4 py-3"
                                                        type="number"
                                                        value={exam.duration}
                                                        onChange={(e) => setExam(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">Max Attempts</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExam(prev => prev ? { ...prev, max_attempts: prev.max_attempts === null ? 1 : null } : null)}
                                                            className={cn(
                                                                "flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full transition-all duration-300",
                                                                exam.max_attempts === null ? "bg-primary text-white shadow-sm shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                                                            )}
                                                        >
                                                            <span className="material-symbols-outlined text-[12px] leading-none">all_inclusive</span>
                                                            {exam.max_attempts === null ? 'Unlimited Active' : 'Set Unlimited'}
                                                        </button>
                                                    </div>
                                                    <div className="relative group/attempt">
                                                        <input
                                                            className={cn(
                                                                "w-full text-sm rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:ring-primary focus:border-primary px-4 py-3 transition-all",
                                                                exam.max_attempts === null ? "text-primary/50 border-primary/20 bg-primary/[0.02]" : ""
                                                            )}
                                                            placeholder={exam.max_attempts === null ? "" : "Enter number..."}
                                                            type="number"
                                                            disabled={exam.max_attempts === null}
                                                            value={exam.max_attempts === null ? '' : exam.max_attempts}
                                                            onChange={(e) => setExam(prev => prev ? { ...prev, max_attempts: Math.max(1, parseInt(e.target.value) || 1) } : null)}
                                                        />
                                                        {exam.max_attempts === null && (
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none animate-in fade-in zoom-in-95 duration-300">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-primary text-lg">all_inclusive</span>
                                                                    <span className="text-sm font-bold text-primary/60 italic">Unlimited Retakes</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Timer Type</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExam(prev => prev ? { ...prev, timer_type: 'flexible' } : null)}
                                                            className={cn(
                                                                "px-3 py-3 text-[10px] font-bold uppercase rounded-xl border transition-all",
                                                                exam.timer_type === 'flexible' ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800"
                                                            )}
                                                        >
                                                            Flexible
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setExam(prev => prev ? { ...prev, timer_type: 'strict' } : null)}
                                                            className={cn(
                                                                "px-3 py-3 text-[10px] font-bold uppercase rounded-xl border transition-all",
                                                                exam.timer_type === 'strict' ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800"
                                                            )}
                                                        >
                                                            Strict
                                                        </button>
                                                    </div>
                                                    <p className="mt-2 text-[9px] text-slate-400 font-medium leading-relaxed px-1">
                                                        {exam.timer_type === 'flexible'
                                                            ? "Students can leave and return. The timer only counts down while the student is active."
                                                            : "The timer keeps running even if the student leaves. Exam ends automatically when time is up."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">access_time</span>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Window</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Starts At</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                                                    value={exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : ''}
                                                    onChange={(e) => setExam(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ends At</label>
                                                    <div className="flex gap-1">
                                                        {[
                                                            { label: '+1D', days: 1 },
                                                            { label: '+2D', days: 2 },
                                                            { label: '+1W', days: 7 }
                                                        ].map((preset) => (
                                                            <button
                                                                key={preset.label}
                                                                type="button"
                                                                onClick={() => {
                                                                    const start = exam.start_time ? new Date(exam.start_time) : new Date();
                                                                    const end = new Date(start.getTime() + preset.days * 24 * 60 * 60 * 1000);
                                                                    setExam(prev => prev ? { ...prev, end_time: end.toISOString() } : null);
                                                                }}
                                                                className="px-2 py-0.5 text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-slate-700"
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                                                    value={exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : ''}
                                                    onChange={(e) => setExam(prev => prev ? { ...prev, end_time: e.target.value } : null)}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">security</span>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security & Publication</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Toggle
                                                label="Show Token"
                                                description="Display access token to students"
                                                icon="key"
                                                checked={exam.is_token_visible}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_token_visible: val } : null)}
                                            />
                                            <Toggle
                                                label="Publish Exam"
                                                description="Make exam live and accessible for students"
                                                icon="rocket_launch"
                                                checked={exam.is_published}
                                                onChange={(val) => setExam(prev => prev ? { ...prev, is_published: val } : null)}
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="w-80 bg-white dark:bg-background-dark border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 no-print overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-primary text-xl">visibility</span>
                            Overview
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">REAL-TIME SETUP SUMMARY</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-sm">vpn_key</span>
                                    <label className="text-[10px] font-bold text-primary uppercase">Security Token</label>
                                </div>
                                <p className="text-3xl font-mono font-black text-primary text-center">
                                    {exam.token || 'AUTOGEN'}
                                </p>
                                {exam.is_published && (
                                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Live & Published
                                    </div>
                                )}
                            </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Primary Info</label>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Type</span>
                                        <span className="font-bold uppercase">{exam.type}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Duration</span>
                                        <span className="font-bold">{exam.duration} Mins</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Passing Score</span>
                                        <span className="font-bold text-primary">{exam.passing_score}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Behavior</label>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Randomize Quest.', val: exam.is_randomized_question },
                                        { label: 'Randomize Opt.', val: exam.is_randomized_answer },
                                        { label: 'Show Results', val: exam.is_show_result },
                                        { label: 'Strict Timer', val: exam.timer_type === 'strict' }
                                    ].map((item) => (
                                        <div key={item.label} className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">{item.label}</span>
                                            <span className={cn(
                                                "material-symbols-outlined text-sm",
                                                item.val ? "text-emerald-500" : "text-slate-300"
                                            )}>
                                                {item.val ? 'check_circle' : 'cancel'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
