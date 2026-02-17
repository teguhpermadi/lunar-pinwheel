import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Student } from '@/lib/api';

interface StudentTableProps {
    students: Student[];
    isLoading: boolean;
    onEdit: (student: Student) => void;
    onDelete: (id: string) => void;
    pagination?: {
        currentPage: number;
        lastPage: number;
        total: number;
        from: number;
        to: number;
    };
    onPageChange: (page: number) => void;
    onBulkDelete?: (ids: string[]) => void;
    onSearch: (query: string) => void;
}

export default function StudentTable({ students, isLoading, onEdit, onDelete, pagination, onPageChange, onBulkDelete, onSearch }: StudentTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(students.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const isAllSelected = students.length > 0 && selectedIds.length === students.length;

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

    const TableSkeleton = () => (
        <>
            <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                    <th className="pl-8 pr-4 py-4 w-12"><Skeleton className="h-4 w-4" /></th>
                    <th className="px-4 py-4"><Skeleton className="h-4 w-24" /></th>
                    <th className="px-4 py-4"><Skeleton className="h-4 w-32" /></th>
                    <th className="px-4 py-4"><Skeleton className="h-4 w-20" /></th>
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
                        <td className="px-4 py-5"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-5"><Skeleton className="h-4 w-16" /></td>
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
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => {
                                if (onBulkDelete) {
                                    onBulkDelete(selectedIds);
                                    setSelectedIds([]);
                                }
                            }}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Delete ({selectedIds.length})
                        </motion.button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchQuery(value);
                                onSearch(value);
                            }}
                            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    </div>
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
                                        <input
                                            className="rounded border-slate-300 text-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700"
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Created</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No students found.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <motion.tr
                                            key={student.id}
                                            variants={item}
                                            className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${selectedIds.includes(student.id) ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                                        >
                                            <td className="pl-8 pr-4 py-5">
                                                <input
                                                    className="rounded border-slate-300 text-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700"
                                                    type="checkbox"
                                                    checked={selectedIds.includes(student.id)}
                                                    onChange={() => handleSelectOne(student.id)}
                                                />
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary overflow-hidden">
                                                        {student.avatar ? (
                                                            <img src={student.avatar} alt={student.name} className="size-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined">person</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-slate-800 dark:text-slate-200">{student.name}</span>
                                                        <span className="text-xs text-slate-400">@{student.username || student.name.toLowerCase().replace(/\s+/g, '')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{student.email}</span>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className="text-xs text-slate-400">
                                                    {new Date(student.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit(student)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(student.id)}
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

            {pagination && (
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {pagination.from}-{pagination.to} of {pagination.total} Results
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        onClick={() => onPageChange(page as number)}
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
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.lastPage}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
