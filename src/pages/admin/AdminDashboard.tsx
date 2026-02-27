import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StatsCard from '@/components/Dashboard/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, DashboardData } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await dashboardApi.getDashboardData();
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
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
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:shadow-sm transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        {format(new Date(), 'MMMM yyyy')}
                    </button>
                    {/* <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Course
                    </button> */}
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
                <StatsCard
                    title="Total Students"
                    value={data?.stats.students_count?.toLocaleString() || '0'}
                    change="+0%"
                    icon="group"
                    colorClass="bg-blue-500 shadow-blue-500/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Active Classes"
                    value={data?.stats.classrooms_count?.toLocaleString() || '0'}
                    change="Steady"
                    icon="meeting_room"
                    colorClass="bg-amber-400 text-slate-900 shadow-amber-400/20"
                    iconBgClass="bg-black/10"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Ongoing Exams"
                    value={data?.stats.ongoing_exams_count?.toLocaleString() || '0'}
                    change="+0"
                    icon="timer"
                    colorClass="bg-rose-500 shadow-rose-500/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="System Health"
                    value="Excellent"
                    change="Stable"
                    icon="bolt"
                    colorClass="bg-primary shadow-primary/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="lg:col-span-2 space-y-8"
                >
                    <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2rem] p-5 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Ongoing Exams</h4>
                                <p className="text-sm text-slate-500 font-medium">Exams currently in progress</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-full flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-rose-600 animate-pulse"></span>
                                    LIVE
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                                ))
                            ) : data?.ongoing_exams.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                                    <p className="font-medium text-sm">No ongoing exams at the moment</p>
                                </div>
                            ) : (
                                data?.ongoing_exams.map((exam) => (
                                    <Link key={exam.id} to={`/admin/exams/${exam.id}/live`} className="group p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-primary/30 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined">assignment</span>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{exam.title}</h5>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{exam.subject}</span>
                                                    •
                                                    <span>{exam.classrooms.join(', ')}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{exam.duration} mins</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Duration</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white px-2">Quick Actions</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {isLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                                ))
                            ) : (
                                [
                                    { icon: 'group', label: 'Students', color: 'blue', to: '/admin/students' },
                                    { icon: 'meeting_room', label: 'Classroom', color: 'amber', to: '/admin/classrooms' },
                                    { icon: 'assignment', label: 'Exam', color: 'rose', to: '/admin/exams' },
                                    { icon: 'task_alt', label: 'Correction', color: 'primary', to: '/admin/exams' },
                                ].map((action) => (
                                    <Link key={action.label} to={action.to} className="group flex flex-col items-center justify-center gap-3 p-4 md:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-lg">
                                        <div className={`size-12 rounded-xl bg-${action.color === 'primary' ? 'primary/10' : action.color + '-100'} text-${action.color === 'primary' ? 'primary' : action.color + '-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined">{action.icon}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{action.label}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h4>
                            <button className="text-primary text-xs font-bold hover:underline">View All</button>
                        </div>

                        <div className="space-y-6 relative flex-1">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"></div>

                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="relative flex gap-4">
                                        <Skeleton className="size-8 rounded-full flex-shrink-0 z-10" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : data?.recent_activities.length === 0 ? (
                                <div className="mt-20 flex flex-col items-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history</span>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">No activities yet</p>
                                </div>
                            ) : (
                                data?.recent_activities.map((activity, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative flex gap-4"
                                    >
                                        <div className="z-10 size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                                            <span className="material-symbols-outlined text-sm text-slate-500">history</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{activity.description.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{format(new Date(activity.created_at), 'HH:mm • dd MMM')}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {!isLoading && data?.recent_activities.length! > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.2 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-auto pt-8 flex flex-col items-center grayscale select-none"
                                >
                                    <span className="material-symbols-outlined text-6xl mb-2">auto_awesome</span>
                                    <p className="text-xs font-bold text-center uppercase tracking-widest">Everything is up to date</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
