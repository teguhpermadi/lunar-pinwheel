import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/Dashboard/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
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
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, Alex. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:shadow-sm transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        This Month
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Course
                    </button>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatsCard
                    title="Total Students"
                    value="1,240"
                    change="+5.2%"
                    icon="group"
                    colorClass="bg-blue-500 shadow-blue-500/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Active Classes"
                    value="42"
                    change="Steady"
                    icon="meeting_room"
                    colorClass="bg-amber-400 text-slate-900 shadow-amber-400/20"
                    iconBgClass="bg-black/10"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Ongoing Exams"
                    value="12"
                    change="+3"
                    icon="timer"
                    colorClass="bg-rose-500 shadow-rose-500/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="Revenue Growth"
                    value="$42.5k"
                    change="+12%"
                    icon="bolt"
                    colorClass="bg-primary shadow-primary/20"
                    iconBgClass="bg-white/20"
                    isLoading={isLoading}
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    variants={container}
                    initial="hidden" // Re-trigger for nested stagger if needed, or inherit from parent if parent was motion.div
                    animate="show"
                    className="lg:col-span-2 space-y-8"
                >
                    {isLoading ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                            <div className="flex justify-between">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    ) : (
                        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Student Engagement</h4>
                                    <p className="text-sm text-slate-500 font-medium">Activity levels over the last 7 days</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-primary"></span>
                                        <span className="text-xs text-slate-500 font-medium">Active Sessions</span>
                                    </div>
                                </div>
                            </div>
                            {/* Placeholder for Chart */}
                            <div className="relative h-64 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-slate-400 font-medium">Chart visualization would go here</p>
                            </div>
                        </motion.div>
                    )}

                    <motion.div variants={item} className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white px-2">Quick Actions</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {isLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                                ))
                            ) : (
                                [
                                    { icon: 'person_add', label: 'Add Student', color: 'blue' },
                                    { icon: 'assignment', label: 'Create Exam', color: 'rose' },
                                    { icon: 'mail', label: 'Message All', color: 'amber' },
                                    { icon: 'analytics', label: 'Reports', color: 'primary' },
                                ].map((action) => (
                                    <button key={action.label} className="group flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-lg">
                                        <div className={`size-12 rounded-xl bg-${action.color === 'primary' ? 'primary/10' : action.color + '-100'} text-${action.color === 'primary' ? 'primary' : action.color + '-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined">{action.icon}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{action.label}</span>
                                    </button>
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
                            ) : (
                                [
                                    { title: "Jane Doe enrolled in UI Design", time: "2 minutes ago", icon: "person_add", color: "blue" },
                                    { title: "Midterm results published", time: "45 minutes ago", icon: "task_alt", color: "rose" },
                                    { title: "New Instructor joined", time: "3 hours ago", icon: "school", color: "amber" },
                                    { title: "System update completed", time: "6 hours ago", icon: "update", color: "primary" },
                                ].map((activity, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative flex gap-4"
                                    >
                                        <div className={`z-10 size-8 rounded-full bg-${activity.color === 'primary' ? 'primary/10' : activity.color + '-100'} flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                                            <span className={`material-symbols-outlined text-sm text-${activity.color === 'primary' ? 'primary' : activity.color + '-600'}`}>{activity.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.title}</p>
                                            <p className="text-xs text-slate-500">{activity.time}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {!isLoading && (
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
