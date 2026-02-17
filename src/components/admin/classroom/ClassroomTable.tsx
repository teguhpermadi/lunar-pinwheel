import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Classroom } from '@/lib/api';

interface ClassroomTableProps {
    classrooms: Classroom[];
    isLoading: boolean;
    onEdit: (classroom: Classroom) => void;
    onDelete: (id: string) => void;
    pagination: {
        currentPage: number;
        lastPage: number;
        total: number;
        from: number;
        to: number;
    };
    onPageChange: (page: number) => void;
    onBulkDelete: (ids: string[]) => void;
    onSearch: (query: string) => void;
}

export default function ClassroomTable({
    classrooms,
    isLoading,
    onEdit,
    onDelete,
    pagination,
    onPageChange,
    onSearch
}: ClassroomTableProps) {

    const getLevelColor = (level?: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'intermediate':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'advanced':
                return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'; // Default gray
        }
    };

    const TableSkeleton = () => (
        <>
            <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                    <th className="pl-8 pr-4 py-4 w-12"><Skeleton className="h-4 w-4" /></th>
                    <th className="px-4 py-4"><Skeleton className="h-4 w-24" /></th>
                    <th className="px-4 py-4"><Skeleton className="h-4 w-20" /></th>
                    <th className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></th>
                    <th className="px-8 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                        <td className="pl-8 pr-4 py-5"><Skeleton className="h-4 w-4" /></td>
                        <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                        <td className="px-4 py-5"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <Skeleton className="size-8 rounded-lg" />
                                <Skeleton className="size-8 rounded-lg" />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </>
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    <label className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Search classrooms..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <span className="material-symbols-outlined">download</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : (
                        <>
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="pl-8 pr-4 py-4 w-12">
                                        <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700" />
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nama (Name)</th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Level</th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Jumlah Siswa</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {classrooms.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-8 text-center text-slate-500">No classrooms found</td>
                                    </tr>
                                ) : (
                                    classrooms.map((classroom) => (
                                        <motion.tr
                                            key={classroom.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                        >
                                            <td className="pl-8 pr-4 py-5">
                                                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700" />
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                                                        <span className="material-symbols-outlined">architecture</span>
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-800 dark:text-slate-200">{classroom.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getLevelColor(classroom.level)}`}>
                                                    {classroom.level || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{classroom.students_count || 0}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit(classroom)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(classroom.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </>
                    )}
                </table>
            </div>
            <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} Classrooms
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={pagination.currentPage === 1}
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    {/* Simplified pagination for now */}
                    <span className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold flex items-center">
                        {pagination.currentPage}
                    </span>
                    <button
                        disabled={pagination.currentPage === pagination.lastPage}
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
