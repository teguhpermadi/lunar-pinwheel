import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';

interface LiveScoreData {
    exam: Exam;
    sessions: {
        id: string;
        student: {
            id: string;
            name: string;
            email: string;
            avatar?: string;
            classroom?: string;
        };
        status: 'in_progress' | 'idle' | 'finished';
        start_time: string;
        remaining_time: number;
        extra_time: number;
        score: number;
    }[];
}

export default function ExamLiveScorePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<LiveScoreData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [activeTab, setActiveTab] = useState('All');

    const fetchLiveScore = async () => {
        if (!id) return;
        try {
            const response = await examApi.liveScore(id);
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching live score:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveScore();
        const interval = setInterval(fetchLiveScore, 5000); // 5 seconds poll
        return () => clearInterval(interval);
    }, [id]);

    const filteredSessions = (data?.sessions || []).filter(session => {
        const matchesSearch = session.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' || session.student.classroom === activeTab;
        return matchesSearch && matchesTab;
    });

    const classroomList = data?.exam.classrooms ? data.exam.classrooms.map(c => c.name) : [];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading && !data) {
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
                <div className="p-6">
                    <Skeleton className="h-[600px] w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
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
                            {data?.exam.title}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">
                            {data?.exam.subject?.name} • {data?.exam.academic_year?.year} • Live Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTokenModal(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold tabular-nums hover:bg-primary/20 transition-colors group/token"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">vpn_key</span>
                        TOKEN: {data?.exam.token || '---'}
                    </button>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold animate-pulse">
                        <span className="size-2 rounded-full bg-emerald-500"></span>
                        LIVE MONITORING
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                            Correction Exam
                        </button>
                        <button
                            onClick={() => navigate(`/admin/exams/${id}/edit`)}
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">settings</span>
                            Settings
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-background-dark/30 flex flex-col">
                    <div className="p-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    placeholder="Search students..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Participants</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {filteredSessions.length}/{(data?.sessions || []).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {classroomList.length > 1 && (
                        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                    activeTab === 'All'
                                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                All Classrooms
                            </button>
                            {classroomList.map((classroom: string) => (
                                <button
                                    key={classroom}
                                    onClick={() => setActiveTab(classroom)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                        activeTab === classroom
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {classroom}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classroom</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Remaining</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Extra Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                        {session.student.avatar ? (
                                                            <img alt="avatar" className="w-full h-full object-cover" src={session.student.avatar} />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-slate-400">person</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{session.student.name}</p>
                                                        <p className="text-[10px] text-slate-400">{session.student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase border border-indigo-100 dark:border-indigo-500/20">
                                                    {session.student.classroom || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {session.status === 'in_progress' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase">In Progress</span>
                                                ) : session.status === 'idle' ? (
                                                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase">Idle</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase">Finished</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className={cn(
                                                    "text-sm font-black tabular-nums",
                                                    session.remaining_time < 300 ? "text-rose-500" : "text-slate-900 dark:text-white"
                                                )}>
                                                    {formatTime(session.remaining_time)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-[10px] font-bold text-primary hover:underline">+ Add Time</button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black text-primary tabular-nums">{session.score}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {data?.exam.token && (
                <TokenModal
                    token={data.exam.token}
                    isOpen={showTokenModal}
                    onClose={() => setShowTokenModal(false)}
                />
            )}
        </div>
    );
}

const TokenModal = ({ token, isOpen, onClose }: { token: string; isOpen: boolean; onClose: () => void }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(token);
        Swal.fire({
            title: 'Copied!',
            text: 'Token copied to clipboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <span className="material-symbols-outlined text-3xl">vpn_key</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Security Token</h2>
                            <p className="text-xs text-slate-500 mb-8 max-w-[200px]">Give this token to students to access the exam.</p>

                            <div
                                onClick={handleCopy}
                                className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer group hover:border-primary/50 transition-colors relative"
                            >
                                <span className="text-5xl font-mono font-black text-primary tracking-tighter block mb-1">
                                    {token}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-primary transition-colors">Click to copy</span>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-primary text-sm">content_copy</span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-8 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Close Dashboard
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
