import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi, Exam } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function StudentExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmCheck, setConfirmCheck] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            setConfirmCheck(false);
            setToken(selectedExam.is_token_visible && selectedExam.token ? selectedExam.token : '');
        } else {
            setConfirmCheck(false);
            setToken('');
        }
    }, [selectedExam]);

    const fetchExams = async () => {
        setIsLoading(true);
        try {
            const response = await studentApi.getStudentExams();
            if (response.success) {
                // Handle different response structures: directly as array or nested in data property
                const examData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setExams(examData);
                if (examData.length > 0) {
                    // Keeping the panel closed initially as requested
                }
            }
        } catch (error) {
            console.error('Failed to fetch exams:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load exams. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartExam = async () => {
        if (!selectedExam) return;
        if (!confirmCheck) {
            MySwal.fire({
                icon: 'warning',
                title: 'Confirmation Required',
                text: 'Please confirm your personal information before starting.',
            });
            return;
        }

        try {
            const response = await studentApi.startExam(selectedExam.id);
            if (response.success) {
                // Navigate to exam page (yet to be implemented or route needs to be known)
                // For now, let's just show success
                MySwal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Exam started successfully!',
                });
            } else {
                MySwal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: response.message || 'Failed to start exam.',
                });
            }
        } catch (error: any) {
            MySwal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'An error occurred while starting the exam.',
            });
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return { date: '-', month: '-', full: '-' };
        const date = new Date(dateString);
        return {
            date: date.getDate().toString(),
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            full: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Helper to group exams (simplified for this implementation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groupExams = () => {
        const groups: { [key: string]: Exam[] } = {
            'Today': [],
            'Upcoming': []
        };

        exams.forEach(exam => {
            const startTime = exam.start_time ? new Date(exam.start_time) : null;
            if (startTime) {
                startTime.setHours(0, 0, 0, 0);
                if (startTime.getTime() === today.getTime()) {
                    groups['Today'].push(exam);
                } else {
                    groups['Upcoming'].push(exam);
                }
            } else {
                groups['Upcoming'].push(exam);
            }
        });

        return groups;
    };

    const groupedExams = groupExams();

    return (
        <div className="flex-1 flex overflow-hidden p-6 gap-8 h-full bg-background-light dark:bg-background-dark/50">
            {/* Left side: Timeline */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Timeline Schedule</h3>
                        <p className="text-sm text-slate-500 font-medium">You have {exams.length} exams scheduled</p>
                    </div>
                    <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative timeline-line">
                    <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 z-0"></div>

                    {isLoading ? (
                        <div className="space-y-8 ml-16">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        Object.keys(groupedExams).map((group) => (
                            groupedExams[group].length > 0 && (
                                <div key={group} className="relative mb-8">
                                    <div className="sticky top-0 z-10 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-[10px] rounded-full z-10 ml-[23px] ${group === 'Today' ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                            <span className={`text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm ${group === 'Today' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                {group}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-16 space-y-4">
                                        {groupedExams[group].map((exam) => {
                                            const { date, month, time } = formatDate(exam.start_time);
                                            const isSelected = selectedExam?.id === exam.id;

                                            return (
                                                <motion.div
                                                    key={exam.id}
                                                    whileHover={{ scale: 1.01 }}
                                                    onClick={() => setSelectedExam(exam)}
                                                    className="relative group cursor-pointer"
                                                >
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-primary/5 rounded-2xl -m-0.5 border-2 border-primary/40 ring-4 ring-primary/5"></div>
                                                    )}
                                                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6 transition-transform">
                                                        <div className={`size-14 shrink-0 rounded-2xl flex flex-col items-center justify-center shadow-lg ${group === 'Today' ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                            <span className="text-[10px] font-black uppercase">{month}</span>
                                                            <span className="text-xl font-black">{date}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {group === 'Today' && (
                                                                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-500/20 text-rose-600 text-[10px] font-bold rounded-full uppercase">Starts at {time}</span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{exam.subject?.name || 'General'}</span>
                                                            </div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{exam.title}</h4>
                                                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {time}</span>
                                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">timer</span> {exam.duration}m</span>
                                                            </div>
                                                        </div>
                                                        <span className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-slate-300'}`}>chevron_right</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>

            {/* Right side: Exam Overview */}
            <motion.div
                initial={false}
                animate={{
                    width: selectedExam || isLoading ? 450 : 0,
                    opacity: selectedExam || isLoading ? 1 : 0,
                    marginLeft: selectedExam || isLoading ? 32 : 0
                }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="flex flex-col h-full overflow-hidden"
            >
                <div className="w-[450px] flex flex-col h-full">
                    <div className="px-2 mb-4 flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Exam Overview</h3>
                        <button
                            onClick={() => setSelectedExam(null)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="skeleton-right"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6"
                            >
                                <div className="space-y-4">
                                    <Skeleton className="size-14 rounded-2xl" />
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-32 w-full rounded-2xl" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                                <div className="mt-auto">
                                    <Skeleton className="h-14 w-full rounded-2xl" />
                                </div>
                            </motion.div>
                        ) : selectedExam ? (
                            <motion.div
                                key={selectedExam.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
                            >
                                <div className="overflow-y-auto custom-scrollbar flex flex-col h-full">
                                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="size-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                                                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${selectedExam.is_published ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600'}`}>
                                                {selectedExam.is_published ? 'OPEN' : 'CLOSED'}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">{selectedExam.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wide">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {formatDate(selectedExam.start_time).time}</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">timer</span> {selectedExam.duration}m</span>
                                        </div>

                                        <div className="mt-8 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Student Verification</p>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="size-10 rounded-full border border-primary/20 p-0.5 shrink-0 overflow-hidden">
                                                    <img
                                                        alt="Student Profile Avatar"
                                                        className="rounded-full size-full object-cover"
                                                        src="https://ui-avatars.com/api/?name=Student&background=7f13ec&color=fff"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Ready to begin?</p>
                                                    <p className="text-xs text-slate-500 truncate">{selectedExam.subject?.name}</p>
                                                </div>
                                            </div>
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className="mt-0.5">
                                                    <input
                                                        className="rounded border-slate-300 text-primary focus:ring-primary size-4 transition-all"
                                                        type="checkbox"
                                                        checked={confirmCheck}
                                                        onChange={(e) => setConfirmCheck(e.target.checked)}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">I confirm that my personal information is correct and I am ready to begin the examination.</span>
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Access Token</p>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">vpn_key</span>
                                                <input
                                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary text-sm font-medium tracking-widest placeholder:tracking-normal placeholder:font-normal outline-none transition-all"
                                                    placeholder="Enter provided token..."
                                                    type="text"
                                                    value={token}
                                                    onChange={(e) => setToken(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        <div className="group">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Rules & Conduct</span>
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Exam Mode</p>
                                                        <p className="text-[11px] text-slate-500">{selectedExam.type} Examination</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                                    <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-amber-500 text-lg">timer</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{selectedExam.duration} Minute Limit</p>
                                                        <p className="text-[11px] text-slate-500">{selectedExam.timer_type === 'strict' ? 'Strict time limit. No pauses allowed.' : 'Flexible timing.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto p-8 pt-4">
                                        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                                            <button
                                                onClick={handleStartExam}
                                                disabled={!selectedExam.is_published}
                                                className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${selectedExam.is_published ? 'bg-primary text-white shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                            >
                                                <span className="material-symbols-outlined">rocket_launch</span>
                                                <span>{selectedExam.is_published ? 'Start Examination' : 'Exam Not Available'}</span>
                                            </button>
                                            <div className="flex items-center justify-center gap-2 mt-4">
                                                <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    {selectedExam.is_published ? 'Make sure you have a stable connection' : 'This exam is currently closed or not yet scheduled.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
