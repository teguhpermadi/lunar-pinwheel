import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { echo } from '@/lib/echo';

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
        status: 'in_progress' | 'idle' | 'finished' | 'completed' | 'timed_out';
        start_time: string;
        remaining_time: number;
        extra_time: number;
        score: number;
        history?: number[]; // ADDED HISTORY FROM BACKEND
        progress: {
            answered: number;
            total: number;
        };
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
        const ticker = setInterval(() => {
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sessions: prev.sessions.map(s => {
                        if (s.status === 'in_progress' && s.remaining_time > 0) {
                            return { ...s, remaining_time: s.remaining_time - 1 };
                        }
                        return s;
                    })
                };
            });
        }, 1000);

        return () => clearInterval(ticker);
    }, []);

    useEffect(() => {
        fetchLiveScore();

        if (!id) return;

        const channel = echo.channel(`exam.${id}.live-score`);

        channel.listen('.LiveScoreUpdated', (event: { sessionData: any }) => {
            setData(prev => {
                if (!prev) return prev;
                const sessions = [...prev.sessions];
                const index = sessions.findIndex(s => s.student.id === event.sessionData.id);

                if (index !== -1) {
                    sessions[index] = { ...sessions[index], ...event.sessionData };
                } else {
                    sessions.push(event.sessionData);
                }

                return { ...prev, sessions };
            });
        });

        return () => {
            channel.stopListening('.LiveScoreUpdated');
        };
    }, [id]);

    const sortedSessions = [...(data?.sessions || [])]
        .filter(session => {
            const matchesSearch = session.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.student.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'All' || session.student.classroom === activeTab;
            return matchesSearch && matchesTab;
        })
        .sort((a, b) => {
            const scoreA = a.score;
            const scoreB = b.score;

            // Priority 1: Status (Finished first? or In Progress first? Usually high score first)
            // Priority 2: Score (Descending)
            if (scoreB !== scoreA) return scoreB - scoreA;
            // Priority 3: Progress percentage
            const aProgress = a.progress.total > 0 ? a.progress.answered / a.progress.total : 0;
            const bProgress = b.progress.total > 0 ? b.progress.answered / b.progress.total : 0;
            if (bProgress !== aProgress) return bProgress - aProgress;
            // Priority 4: Name
            return a.student.name.localeCompare(b.student.name);
        });

    const classroomList = data?.exam.classrooms ? data.exam.classrooms.map(c => c.name) : [];

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Keep track of previous ranks for animation
    const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});

    useEffect(() => {
        if (sortedSessions.length > 0) {
            const currentRanks: Record<string, number> = {};
            sortedSessions.forEach((s, i) => {
                currentRanks[s.student.id] = i;
            });

            // Only update if it's the first time or if something actually changed
            // To avoid infinite loops, we use a timeout or check if values are different
            setPrevRanks(currentRanks);
        }
    }, [data?.sessions]); // Update when data.sessions changes

    const getRankChange = (studentId: string, currentIndex: number) => {
        const prevIndex = prevRanks[studentId];
        if (prevIndex === undefined) return 0;
        return prevIndex - currentIndex; // positive means moved up (index decreased)
    };

    const handleForceFinish = async (user_id: string, name: string) => {
        if (!id) return;
        const result = await Swal.fire({
            title: 'Force Finish?',
            text: `Are you sure you want to force finish ${name}'s exam? This will close their session and calculate their final score immediately.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            confirmButtonText: 'Yes, Finish it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await examApi.forceFinish(id, user_id);
                if (response.success) {
                    Swal.fire({
                        title: 'Finished!',
                        text: 'Exam has been forced to finish.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                    fetchLiveScore();
                }
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to force finish exam', 'error');
            }
        }
    };

    const handleAddTime = async (user_id: string, name: string) => {
        if (!id) return;
        const { value: minutes } = await Swal.fire({
            title: `Add Extra Time`,
            text: `How many minutes would you like to add for ${name}?`,
            input: 'number',
            inputPlaceholder: 'Minutes (e.g. 10)',
            inputValue: 10,
            showCancelButton: true,
            confirmButtonText: 'Add Time',
            inputValidator: (value) => {
                if (!value || isNaN(Number(value)) || Number(value) < 1) {
                    return 'Please enter a valid number of minutes';
                }
                return null;
            }
        });

        if (minutes) {
            try {
                const response = await examApi.addTime(id, user_id, parseInt(minutes));
                if (response.success) {
                    Swal.fire({
                        title: 'Success!',
                        text: `Added ${minutes} minutes to ${name}'s exam.`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                    fetchLiveScore();
                }
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to add extra time', 'error');
            }
        }
    };

    const handleReopenExam = async (user_id: string, name: string) => {
        if (!id) return;

        const { value: minutes } = await Swal.fire({
            title: 'Reopen Exam?',
            html: `
                <div class="text-left space-y-3 overflow-x-hidden">
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to reopen <b>${name}</b>'s exam? This will allow them to continue answering questions.
                    </p>
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-slate-500">ADD EXTRA TIME (MINUTES - OPTIONAL)</label>
                        <input id="swal-input-minutes" type="number" 
                            class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                            placeholder="0" min="0">
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Yes, Reopen!',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const input = document.getElementById('swal-input-minutes') as HTMLInputElement;
                return input.value ? parseInt(input.value) : 0;
            }
        });

        if (minutes !== undefined) {
            try {
                const response = await examApi.reopenExam(id, user_id, minutes);
                if (response.success) {
                    Swal.fire({
                        title: 'Reopened!',
                        text: minutes > 0
                            ? `Exam reopened with ${minutes} extra minutes.`
                            : 'Exam session has been reopened.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                    fetchLiveScore();
                }
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to reopen exam', 'error');
            }
        }
    };

    if (isLoading && !data) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-background-dark/30 animate-pulse">
                <header className="min-h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-full sm:w-64" />
                            <Skeleton className="h-3 w-3/4 sm:w-48" />
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
            <header className="min-h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex flex-col lg:flex-row items-center justify-between z-20 shrink-0 gap-4">
                <div className="flex items-center gap-3 md:gap-4 w-full lg:flex-1">
                    <button
                        onClick={() => navigate('/admin/exams')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base md:text-xl font-bold text-slate-900 dark:text-white truncate">
                            {data?.exam.title}
                        </h1>
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-wide truncate">
                            {data?.exam.subject?.name} • {data?.exam.academic_year?.year} • Live Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => setShowTokenModal(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] md:text-[10px] font-bold tabular-nums hover:bg-primary/20 transition-colors group/token"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">vpn_key</span>
                        TOKEN: {data?.exam.token || '---'}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] md:text-[10px] font-bold animate-pulse">
                        <span className="size-2 rounded-full bg-emerald-500"></span>
                        <span className="hidden sm:inline">LIVE MONITORING</span>
                        <span className="sm:hidden">LIVE</span>
                    </div>
                    <div className="hidden lg:block h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <button
                            onClick={() => navigate(`/admin/exams/${id}/correction`)}
                            className="flex-1 sm:flex-none px-3 md:px-5 py-2 md:py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base md:text-lg">fact_check</span>
                            Correction
                        </button>
                        <button
                            onClick={() => navigate(`/admin/exams/${id}/edit`)}
                            className="px-3 md:px-4 py-2 md:py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base md:text-lg">settings</span>
                            <span className="hidden sm:inline">Settings</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-background-dark/30 flex flex-col">
                    <div className="p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    placeholder="Search students..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Participants</p>
                                <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                    {sortedSessions.length}/{(data?.sessions || []).length}
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
                    <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-hide">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classroom</th>
                                            <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Progress</th>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="hidden xl:table-cell px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Time</th>
                                            <th className="hidden md:table-cell px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Remaining</th>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                            <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 relative">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {sortedSessions.map((session, index) => {
                                                const progressPercent = session.progress.total > 0
                                                    ? (session.progress.answered / session.progress.total) * 100
                                                    : 0;

                                                return (
                                                    <motion.tr
                                                        key={session.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 300,
                                                            damping: 30,
                                                            opacity: { duration: 0.2 }
                                                        }}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group bg-white dark:bg-slate-900"
                                                    >
                                                        <td className="px-4 md:px-6 py-4">
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <div className="relative">
                                                                    <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative shadow-sm">
                                                                        {session.student.avatar ? (
                                                                            <img alt="avatar" className="w-full h-full object-cover rounded-full" src={session.student.avatar} />
                                                                        ) : (
                                                                            <span className="material-symbols-outlined text-slate-400">person</span>
                                                                        )}

                                                                        {/* Rank Change Indicator */}
                                                                        {getRankChange(session.student.id, index) !== 0 && (
                                                                            <motion.div
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                className={cn(
                                                                                    "absolute -right-1 -bottom-1 size-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-10",
                                                                                    getRankChange(session.student.id, index) > 0
                                                                                        ? "bg-emerald-500 text-white"
                                                                                        : "bg-rose-500 text-white"
                                                                                )}
                                                                            >
                                                                                <span className="material-symbols-outlined text-[14px] font-black">
                                                                                    {getRankChange(session.student.id, index) > 0 ? "expand_less" : "expand_more"}
                                                                                </span>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                    {index < 3 && (
                                                                        <div className={cn(
                                                                            "absolute -top-1 -left-1 size-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-900 shadow-sm z-10",
                                                                            index === 0 ? "bg-yellow-400 text-yellow-900" :
                                                                                index === 1 ? "bg-slate-300 text-slate-700" :
                                                                                    "bg-amber-600 text-amber-50"
                                                                        )}>
                                                                            {index + 1}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{session.student.name}</p>
                                                                    <p className="text-[10px] text-slate-400">{session.student.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="hidden lg:table-cell px-6 py-4">
                                                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase border border-indigo-100 dark:border-indigo-500/20">
                                                                {session.student.classroom || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="hidden sm:table-cell px-6 py-4">
                                                            <div className="flex flex-col gap-1.5 min-w-[100px] md:min-w-[120px]">
                                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                                    <span className="text-slate-400">{session.progress.answered}/{session.progress.total}</span>
                                                                    <span className="text-primary">{Math.round(progressPercent)}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${progressPercent}%` }}
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all duration-500",
                                                                            progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {session.status === 'in_progress' ? (
                                                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase">In Progress</span>
                                                            ) : session.status === 'idle' ? (
                                                                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase">Idle</span>
                                                            ) : session.status === 'completed' ? (
                                                                <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase">Completed (Waiting)</span>
                                                            ) : session.status === 'timed_out' ? (
                                                                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase animate-pulse">Time Out</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase">Finished</span>
                                                            )}
                                                        </td>
                                                        <td className="hidden xl:table-cell px-6 py-4">
                                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                                {session.start_time ? new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                            </p>
                                                        </td>
                                                        <td className="hidden md:table-cell px-6 py-4 text-center">
                                                            <p className={cn(
                                                                "text-sm font-black tabular-nums",
                                                                session.remaining_time < 300 && session.remaining_time > 0 ? "text-rose-500 animate-pulse" : "text-slate-900 dark:text-white"
                                                            )}>
                                                                {formatTime(session.remaining_time)}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-4">
                                                            <div className="flex items-center justify-center gap-1.5 md:gap-2">
                                                                {(session.status === 'in_progress' || session.status === 'completed' || session.status === 'timed_out') && (
                                                                    <button
                                                                        onClick={() => handleForceFinish(session.student.id, session.student.name)}
                                                                        className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                                                                        title="Force Finish"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base md:text-lg">stop_circle</span>
                                                                    </button>
                                                                )}
                                                                {session.status === 'finished' && (
                                                                    <button
                                                                        onClick={() => handleReopenExam(session.student.id, session.student.name)}
                                                                        className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                                                                        title="Reopen Exam"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base md:text-lg">play_circle</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleAddTime(session.student.id, session.student.name)}
                                                                    className="text-[9px] md:text-[10px] font-bold text-primary hover:underline transition-all active:scale-90 shrink-0"
                                                                >
                                                                    <span className="hidden sm:inline">+ Add Time</span>
                                                                    <span className="sm:hidden">+ Time</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-4 text-right">
                                                            <div className="flex flex-col items-end justify-center h-full gap-1">
                                                                <span className="text-base md:text-lg font-black text-primary tabular-nums leading-none">
                                                                    {session.score}
                                                                </span>
                                                                {(session.history?.length || 0) > 0 && (
                                                                    <div className="flex gap-1">
                                                                        {session.history?.map((h: number, i: number) => (
                                                                            <span
                                                                                key={i}
                                                                                className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold leading-none"
                                                                                title={`History attempt ${i + 1}`}
                                                                            >
                                                                                {h}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
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
