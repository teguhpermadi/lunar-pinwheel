import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { questionBankApi, QuestionBank } from '@/lib/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const MySwal = withReactContent(Swal);

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export default function QuestionBankList() {
    const { user } = useAuth();
    const { selectedYearId } = useAcademicYear();
    const navigate = useNavigate();

    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchQuestionBanks = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                per_page: 10,
                search: searchQuery,
                academic_year_id: selectedYearId
            };

            const response = await questionBankApi.getQuestionBanks(params);
            if (response.success) {
                const result = response.data as any;
                const items = Array.isArray(result) ? result : (result.data || []);
                setQuestionBanks(items);

                const meta = result.meta || (response as any).meta;
                if (meta) {
                    setTotalPages(meta.last_page);
                    setTotalItems(meta.total);
                }
            }
        } catch (error) {
            console.error('Failed to fetch question banks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedYearId) {
            fetchQuestionBanks();
        }
    }, [page, searchQuery, selectedYearId]);

    const handleDelete = async (id: string) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await questionBankApi.deleteQuestionBank(id);
                MySwal.fire('Deleted!', 'Question bank has been deleted.', 'success');
                fetchQuestionBanks();
            } catch (error) {
                console.error('Failed to delete', error);
                MySwal.fire('Error!', 'Failed to delete question bank.', 'error');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Question Banks</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your question banks and assessments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        to="/admin/question-banks/create"
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Question Bank
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Available Banks</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Search banks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="pl-8 pr-4 py-4 w-12 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">#</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Bank Details</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Questions</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        <td className="pl-8 pr-4 py-5 text-center">
                                            <Skeleton className="h-4 w-8 mx-auto" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex items-start gap-3">
                                                <Skeleton className="size-10 rounded-xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <Skeleton className="size-8 rounded-full mx-auto" />
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Skeleton className="h-9 w-24 rounded-lg" />
                                                <Skeleton className="size-9 rounded-lg" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : questionBanks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">library_books</span>
                                            <p>No question banks found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : questionBanks.map((bank, index) => (
                                <tr
                                    key={bank.id}
                                    onClick={() => navigate(`/admin/question-banks/${bank.id}/show`)}
                                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                                >
                                    <td className="pl-8 pr-4 py-5 text-center text-slate-400 text-sm font-medium">
                                        {(page - 1) * 10 + index + 1}
                                    </td>
                                    <td className="px-4 py-5 max-w-md">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 size-10 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">library_books</span>
                                            </div>
                                            <div>
                                                <span className="block font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{bank.name}</span>
                                                <span className="text-xs text-slate-400 line-clamp-1">
                                                    Updated {timeAgo(bank.updated_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {(bank as any).subject?.name || 'Unknown Subject'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                            {bank.questions_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <Link
                                                to={`/admin/question-banks/${bank.id}`}
                                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit_document</span>
                                                Manage
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(bank.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                            }
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalItems)} of {totalItems} Banks
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold ${page === p ? 'bg-primary text-white border border-primary' : 'border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-500'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
