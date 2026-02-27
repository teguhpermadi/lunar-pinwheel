import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
    user: {
        name: string;
        avatar: string | null;
    };
    stats: {
        xp: number;
        level: number;
        streak: number;
        xp_to_next: number;
        next_rank: string;
        progress_to_next: number;
    };
    active_exams: {
        id: string;
        title: string;
        subject: string | null;
        status: string;
        progress: number;
        color: string;
        icon: string;
        end_time: string;
    }[];
    upcoming_exams: {
        id: string;
        title: string;
        subject: string | null;
        start_time: string;
        end_time: string;
        time_label: string;
        meta: string;
        color: string;
        icon: string;
    }[];
}

export default function StudentDashboard() {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/v1/students/dashboard');
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto">
            {isLoading ? (
                <Skeleton className="w-full h-[400px] rounded-[2.5rem]" />
            ) : (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-primary rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/30 relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
                        <div className="space-y-4 max-w-xl text-center md:text-left">
                            <span className="px-3 md:px-4 py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">Active Streak: {data?.stats.streak ?? 0} Days 🔥</span>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Welcome back, {data?.user.name.split(' ')[0]}!</h2>
                            <p className="text-primary-100 text-base md:text-lg opacity-80">You're just {data?.stats.xp_to_next ?? 0} XP away from reaching Level {(data?.stats.level ?? 0) + 1}. Keep up the great work!</p>
                            <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                    <div className="size-10 bg-amber-400 rounded-xl flex items-center justify-center text-slate-900">
                                        <span className="material-symbols-outlined">stars</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase opacity-60">Level</p>
                                        <p className="text-sm font-bold">{data?.stats.level}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                    <div className="size-10 bg-blue-400 rounded-xl flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase opacity-60">Total XP</p>
                                        <p className="text-sm font-bold">{data?.stats.xp} XP</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-72 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                            <div className="flex justify-between items-end mb-4">
                                <h4 className="font-bold">Next Rank</h4>
                                <span className="text-xs font-medium opacity-60">{data?.stats.next_rank}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                    <div className="bg-yellow-400 h-full rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" style={{ width: `${data?.stats.progress_to_next ?? 0}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span>{data?.stats.xp} XP</span>
                                    <span className="text-yellow-400">{((data?.stats.level ?? 1)) * 1000} XP</span>
                                </div>
                                <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-yellow-400 hover:text-slate-900 transition-all">Claim Daily Reward</button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="lg:col-span-2 space-y-6 md:space-y-8"
                >
                    {isLoading ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                            <div className="flex justify-between">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="size-8 rounded-lg" />
                            </div>
                            <div className="space-y-6">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="size-8 rounded-lg" />
                                                <Skeleton className="h-4 w-48" />
                                            </div>
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                        <Skeleton className="w-full h-2.5 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Active Exams</h4>
                                    <p className="text-sm text-slate-500 font-medium">Exams you need to participate in right now</p>
                                </div>
                                <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    {data?.active_exams?.length ?? 0} Available
                                </div>
                            </div>
                            <div className="space-y-6">
                                {data?.active_exams && data.active_exams.length > 0 ? (
                                    data.active_exams.map((exam) => (
                                        <div key={exam.id} className="p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-12 bg-${exam.color}-100 dark:bg-${exam.color}-500/10 rounded-2xl flex items-center justify-center text-${exam.color}-600 group-hover:scale-110 transition-transform`}>
                                                        <span className="material-symbols-outlined text-2xl">{exam.icon}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-primary uppercase tracking-widest">{exam.subject ?? 'General'}</span>
                                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${exam.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {exam.status}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium italic">Ends: {new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="hidden md:block text-right">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Progress</p>
                                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{exam.progress}%</p>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/exams/${exam.id}/take`)}
                                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                                    >
                                                        {exam.status === 'In Progress' ? 'Resume' : 'Start Exam'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div className={`bg-${exam.color}-500 h-full rounded-full transition-all duration-500`} style={{ width: `${exam.progress}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="size-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-slate-300 text-3xl">task_alt</span>
                                        </div>
                                        <h5 className="font-bold text-slate-900 dark:text-white">All caught up!</h5>
                                        <p className="text-xs text-slate-500 font-medium mt-1">No active exams assigned to your classroom today.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <motion.div variants={item} className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white px-2">Quick Actions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {isLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                                ))
                            ) : (
                                [
                                    { label: "My Exams", icon: "quiz", color: "rose", path: "/exams" },
                                    { label: "My Results", icon: "history", color: "blue", path: "/history" },
                                    { label: "Leaderboard", icon: "leaderboard", color: "amber", path: "/leaderboard" },
                                    { label: "Settings", icon: "settings", color: "primary", path: "/settings" },
                                ].map((step) => (
                                    <button
                                        key={step.label}
                                        onClick={() => navigate(step.path)}
                                        className="group flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-lg"
                                    >
                                        <div className={`size-12 rounded-xl bg-${step.color === 'primary' ? 'primary/10' : step.color + '-100'} text-${step.color === 'primary' ? 'primary' : step.color + '-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined">{step.icon}</span>
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight text-center">{step.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Exams</h4>
                            <button className="text-primary text-xs font-bold hover:underline">Full Schedule</button>
                        </div>
                        <div className="space-y-6 relative flex-1">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"></div>

                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="relative flex gap-4">
                                        <Skeleton className="size-8 rounded-full flex-shrink-0 z-10" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3 w-1/3 mb-1" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                data?.upcoming_exams && data.upcoming_exams.length > 0 ? (
                                    data.upcoming_exams.map((exam, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative flex gap-4"
                                        >
                                            <div className={`z-10 size-8 rounded-full bg-${exam.color === 'rose' ? 'rose-500 text-white' : exam.color + '-100 text-' + exam.color + '-600'} flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                                                <span className="material-symbols-outlined text-sm">{exam.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-black ${exam.color === 'rose' ? 'text-rose-600' : 'text-slate-400'} uppercase tracking-widest mb-1`}>{exam.time_label}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                                                <p className="text-xs text-slate-500">{exam.meta}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 font-medium italic">No upcoming exams scheduled.</p>
                                    </div>
                                )
                            )}

                            {!isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.2 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-auto pt-8 flex flex-col items-center grayscale select-none"
                                >
                                    <span className="material-symbols-outlined text-6xl mb-2">event_available</span>
                                    <p className="text-xs font-bold text-center uppercase tracking-widest">Study hard, score big</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
