import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudentSession } from '../ExamCorrectionPage';
import { examApi } from '@/lib/api';
import Swal from 'sweetalert2';

interface CorrectionLeaderboardProps {
    sessions: StudentSession[];
    searchQuery: string;
    onRefresh: () => void;
    id: string; // exam id
}

const CorrectionLeaderboard: React.FC<CorrectionLeaderboardProps> = ({ sessions, searchQuery, onRefresh, id }) => {
    const [isRecalculating, setIsRecalculating] = useState<string | null>(null);
    const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);

    const filteredSessions = sessions
        .filter(s => s.student.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

    const handleRecalculate = async (sessionId: string) => {
        setIsRecalculating(sessionId);
        try {
            const response = await examApi.recalculateScore(sessionId);
            if (response.success) {
                Swal.fire({
                    title: 'Recalculated',
                    text: 'Student score has been updated.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                onRefresh();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to recalculate score', 'error');
        } finally {
            setIsRecalculating(null);
        }
    };

    const handleRecalculateAll = async () => {
        const result = await Swal.fire({
            title: 'Recalculate All?',
            text: 'This will re-evaluate scores for all students in this exam. This might take a while.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Recalculate All',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3b82f6',
        });

        if (!result.isConfirmed) return;

        setIsRecalculatingAll(true);
        try {
            const response = await examApi.recalculateAllScores(id);
            if (response.success) {
                Swal.fire({
                    title: 'Success',
                    text: response.message,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                onRefresh();
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to recalculate all scores', 'error');
        } finally {
            setIsRecalculatingAll(false);
        }
    };

    const getStatusColor = (session: StudentSession) => {
        if (session.is_corrected) return 'bg-emerald-500';
        if (session.is_finished) return 'bg-blue-500';
        return 'bg-slate-300';
    };

    const getStatusText = (session: StudentSession) => {
        if (session.is_corrected) return 'Corrected';
        if (session.is_finished) return 'Finished';
        return 'In Progress';
    };

    const formatDuration = (startTime?: string, finishTime?: string) => {
        if (!startTime || !finishTime) return '-';

        const start = new Date(startTime);
        const finish = new Date(finishTime);
        const diffInSeconds = Math.floor((finish.getTime() - start.getTime()) / 1000);

        if (diffInSeconds < 0) return '00:00:00';

        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Exam Leaderboard</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ranking by Final Score</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center gap-2">
                            <span className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400 border-r border-slate-200 dark:border-slate-700">
                                {filteredSessions.length} Students Shown
                            </span>
                            <button
                                onClick={handleRecalculateAll}
                                disabled={isRecalculatingAll}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                    isRecalculatingAll
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-white dark:bg-slate-900 shadow-sm text-primary hover:bg-primary hover:text-white"
                                )}
                            >
                                <span className={cn("material-symbols-outlined text-sm", isRecalculatingAll && "animate-spin")}>
                                    {isRecalculatingAll ? 'sync' : 'calculate'}
                                </span>
                                {isRecalculatingAll ? 'Recalculating...' : 'Recalculate All'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredSessions.map((session, index) => (
                                <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "flex items-center justify-center size-8 rounded-xl text-xs font-black",
                                            index === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" :
                                                index === 1 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                                    index === 2 ? "bg-orange-100 text-orange-600 border border-orange-200" :
                                                        "bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800"
                                        )}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-200 dark:border-slate-800">
                                                {session.student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{session.student.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{session.student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("size-2 rounded-full", getStatusColor(session))} />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{getStatusText(session)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                            {formatDuration(session.start_time, session.finish_time)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${session.progress_percent || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 mt-1 block uppercase tracking-tighter">
                                            {session.progress_percent || 0}% Completed
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-black rounded-lg border border-indigo-100 dark:border-indigo-500/20 tabular-nums">
                                            {session.final_score}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleRecalculate(session.id)}
                                            disabled={isRecalculating === session.id}
                                            className={cn(
                                                "p-2 rounded-xl border transition-all active:scale-95 group/btn",
                                                isRecalculating === session.id
                                                    ? "bg-slate-50 border-slate-100 animate-pulse cursor-not-allowed"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                                            )}
                                            title="Recalculate Score"
                                        >
                                            <span className={cn(
                                                "material-symbols-outlined text-lg block",
                                                isRecalculating === session.id && "animate-spin"
                                            )}>
                                                {isRecalculating === session.id ? 'sync' : 'calculate'}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSessions.length === 0 && (
                    <div className="p-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">person_search</span>
                        <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No students found matching your search</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CorrectionLeaderboard;
