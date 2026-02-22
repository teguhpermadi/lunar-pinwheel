import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examApi, Exam } from '@/lib/api';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExamManagementPage() {
    const { selectedYearId } = useAcademicYear();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    const fetchExams = async (page = 1, search = searchQuery) => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                sort_by: 'created_at',
                order: 'desc'
            };

            if (search) {
                params.search = search;
            }

            if (selectedYearId) {
                params.academic_year_id = selectedYearId;
            }

            const response = await examApi.getExams(params);
            if (response.success && response.data) {
                const result = response.data;
                const data = Array.isArray(result) ? result : result.data;
                setExams(data || []);

                if (!Array.isArray(result)) {
                    setPagination({
                        currentPage: result.meta?.current_page || result.current_page || 1,
                        lastPage: result.meta?.last_page || result.last_page || 1,
                        total: result.meta?.total || result.total || 0,
                        from: result.meta?.from || result.from || 0,
                        to: result.meta?.to || result.to || 0
                    });
                }
            } else {
                setExams([]);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams(1, searchQuery);
    }, [selectedYearId]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== undefined) {
                fetchExams(1, searchQuery);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchExams(newPage, searchQuery);
        }
    };

    const getStatusBadge = (exam: Exam) => {
        const now = new Date();
        const start = exam.start_time ? new Date(exam.start_time) : null;
        const end = exam.end_time ? new Date(exam.end_time) : null;

        if (!exam.is_published) {
            return (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Draft
                </span>
            );
        }

        if (start && now < start) {
            return (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Scheduled
                </span>
            );
        }

        if (end && now > end) {
            return (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 dark:bg-slate-800/80 dark:text-slate-500">
                    Completed
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
            </span>
        );
    };

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Exam Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Review student performance and monitor live sessions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
                            placeholder="Search exams..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Scheduled and Active Exams</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="pl-8 pr-4 py-4 w-12 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">#</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Title</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject Name</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Target Classrooms</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Exam Status</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="pl-8 pr-4 py-5"><Skeleton className="h-4 w-4 mx-auto" /></td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="size-10 rounded-xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-48" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="px-4 py-5"><Skeleton className="h-5 w-20 rounded-full mx-auto" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-8 w-32 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : exams.length > 0 ? (
                                exams.map((exam, index) => (
                                    <tr key={exam.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="pl-8 pr-4 py-5 text-center text-slate-400 text-sm font-medium">
                                            {(pagination.from + index).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined">assignment</span>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-slate-800 dark:text-slate-200">{exam.title}</span>
                                                    <span className="text-xs text-slate-400">{exam.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                {exam.subject?.name || 'No Subject'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {exam.classrooms && exam.classrooms.length > 0 ? (
                                                    <>
                                                        {exam.classrooms.slice(0, 2).map(cls => (
                                                            <span key={cls.id} className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase border border-indigo-100 dark:border-indigo-500/20">
                                                                {cls.name}
                                                            </span>
                                                        ))}
                                                        {exam.classrooms.length > 2 && (
                                                            <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase border border-slate-200 dark:border-slate-700">
                                                                +{exam.classrooms.length - 2} More
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic font-medium">No Classrooms</span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {exam.academic_year?.year || 'Unknown Year'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            {getStatusBadge(exam)}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/exams/${exam.id}/live`}
                                                    className="px-4 py-2 bg-primary text-white text-[11px] font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                                                    title="Live Score"
                                                >
                                                    <span className="material-symbols-outlined text-sm">leaderboard</span>
                                                    LIVE SCORE
                                                </Link>
                                                <Link
                                                    to={`/admin/exams/${exam.id}/edit`}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </Link>
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                                        No exams found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {pagination.from}-{pagination.to} of {pagination.total} Results
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1 || isLoading}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>

                        {(() => {
                            const range = [];
                            const delta = 1;
                            const left = pagination.currentPage - delta;
                            const right = pagination.currentPage + delta + 1;
                            const rangeWithDots = [];
                            let l;

                            for (let i = 1; i <= pagination.lastPage; i++) {
                                if (i === 1 || i === pagination.lastPage || (i >= left && i < right)) {
                                    range.push(i);
                                }
                            }

                            for (let i of range) {
                                if (l) {
                                    if (i - l === 2) {
                                        rangeWithDots.push(l + 1);
                                    } else if (i - l !== 1) {
                                        rangeWithDots.push('...');
                                    }
                                }
                                rangeWithDots.push(i);
                                l = i;
                            }

                            return rangeWithDots.map((page, index) => (
                                page === '...' ? (
                                    <span key={`dots-${index}`} className="px-2 py-1 flex items-center text-slate-400">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page as number)}
                                        disabled={isLoading}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${pagination.currentPage === page
                                            ? 'bg-primary text-white'
                                            : 'border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ));
                        })()}

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.lastPage || isLoading}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
