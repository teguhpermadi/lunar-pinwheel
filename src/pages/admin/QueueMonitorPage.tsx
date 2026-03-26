import { useEffect, useState, useCallback } from 'react';
import {
    Activity,
    RefreshCw,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    RotateCcw,
    AlertTriangle,
    StopCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
} from 'lucide-react';
import { queueMonitorApi, QueueMonitor } from '@/lib/api';

type StatusFilter = '' | 'running' | 'succeeded' | 'failed';

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'running', label: 'Running' },
    { value: 'succeeded', label: 'Succeeded' },
    { value: 'failed', label: 'Failed' },
];

export default function QueueMonitorPage() {
    const [monitors, setMonitors] = useState<QueueMonitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [purging, setPurging] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(15);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchMonitors = useCallback(async (page = currentPage) => {
        setLoading(true);
        try {
            const res = await queueMonitorApi.getMonitors({
                per_page: perPage,
                page,
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
            });

            const data: QueueMonitor[] = res.data || [];
            setMonitors(data);

            if (res.meta) {
                setMeta(res.meta);
            }
        } catch (error) {
            console.error('Failed to fetch monitors', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchMonitors(currentPage);
    }, [currentPage, debouncedSearch, statusFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleStatusChange = (value: StatusFilter) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handlePurge = async () => {
        if (!confirm('Are you sure you want to purge all queue monitors?')) return;
        setPurging(true);
        try {
            await queueMonitorApi.purgeMonitors();
            setCurrentPage(1);
            await fetchMonitors(1);
            showToast('success', 'All queue records purged.');
        } catch {
            showToast('error', 'Failed to purge queue records.');
        } finally {
            setPurging(false);
        }
    };

    const handleRetry = async (monitor: QueueMonitor) => {
        setActionLoadingId(monitor.id);
        try {
            await queueMonitorApi.retryMonitor(monitor.id);
            showToast('success', `Job "${monitor.name}" queued for retry.`);
            await fetchMonitors(currentPage);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to retry job.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancel = async (monitor: QueueMonitor) => {
        if (!confirm(`Cancel running job "${monitor.name}"?`)) return;
        setActionLoadingId(monitor.id);
        try {
            await queueMonitorApi.cancelMonitor(monitor.id);
            showToast('success', `Job "${monitor.name}" has been cancelled.`);
            await fetchMonitors(currentPage);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to cancel job.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDelete = async (monitor: QueueMonitor) => {
        if (!confirm(`Delete record for "${monitor.name}"?`)) return;
        setActionLoadingId(monitor.id);
        try {
            await queueMonitorApi.deleteMonitor(monitor.id);
            showToast('success', 'Job record deleted.');
            setMonitors(prev => prev.filter(m => m.id !== monitor.id));
        } catch {
            showToast('error', 'Failed to delete job record.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const isFailed = (m: QueueMonitor) => m.status === 2; // MonitorStatus::FAILED
    const isRunning = (m: QueueMonitor) => m.status === 0 || m.status === 4; // RUNNING or QUEUED

    const StatusBadge = ({ monitor }: { monitor: QueueMonitor }) => {
        if (monitor.status === 2) { // FAILED
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full whitespace-nowrap">
                    <XCircle className="size-3.5" /> Failed
                </span>
            );
        }
        if (monitor.status === 1 || monitor.status === 3) { // SUCCEEDED or STALE
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full whitespace-nowrap">
                    <CheckCircle2 className="size-3.5" /> Success
                </span>
            );
        }
        if (monitor.status === 4) { // QUEUED
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap">
                    <Loader2 className="size-3.5" /> Queued
                </span>
            );
        }
        // RUNNING (0)
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full whitespace-nowrap">
                <Loader2 className="size-3.5 animate-spin" /> Running
            </span>
        );
    };

    // Pagination component
    const Pagination = () => {
        if (!meta || meta.last_page <= 1) return null;
        const { current_page, last_page, from, to, total } = meta;

        const pages: (number | '...')[] = [];
        if (last_page <= 7) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current_page > 3) pages.push('...');
            for (let i = Math.max(2, current_page - 1); i <= Math.min(last_page - 1, current_page + 1); i++) {
                pages.push(i);
            }
            if (current_page < last_page - 2) pages.push('...');
            pages.push(last_page);
        }

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-medium text-slate-700 dark:text-slate-300">{from ?? 0}–{to ?? 0}</span> of{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> jobs
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handlePageChange(current_page - 1)}
                        disabled={current_page === 1}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    {pages.map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-3 py-1.5 text-sm text-slate-400">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => handlePageChange(p as number)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    p === current_page
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => handlePageChange(current_page + 1)}
                        disabled={current_page === last_page}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-200
                    ${toast.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700'
                        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
                    }`}
                >
                    {toast.type === 'success'
                        ? <CheckCircle2 className="size-4 shrink-0" />
                        : <AlertTriangle className="size-4 shrink-0" />
                    }
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="size-6 text-primary" />
                        Queue Monitor
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor background jobs and processes in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchMonitors(currentPage)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm text-sm font-medium"
                    >
                        <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handlePurge}
                        disabled={loading || purging}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        {purging ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        Purge All
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by job name or description..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={e => handleStatusChange(e.target.value as StatusFilter)}
                        className="pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                                <th className="px-6 py-4 font-medium">Job Name</th>
                                <th className="px-6 py-4 font-medium">Queue</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Started At</th>
                                <th className="px-6 py-4 font-medium hidden md:table-cell">Duration</th>
                                <th className="px-6 py-4 font-medium hidden lg:table-cell">Attempt</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading && monitors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                                        Loading queue data...
                                    </td>
                                </tr>
                            ) : monitors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Activity className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-slate-500 font-medium">No jobs found</p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {search || statusFilter ? 'Try adjusting your filters.' : 'No background jobs have been recorded yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                monitors.map((monitor) => {
                                    const isActing = actionLoadingId === monitor.id;
                                    return (
                                        <tr
                                            key={monitor.id}
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${loading ? 'opacity-60' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">{monitor.name || 'Unknown Job'}</div>
                                                <div className="text-xs text-slate-500 mt-1 truncate max-w-[220px] font-mono">{monitor.job_id || monitor.job_uuid}</div>
                                                {monitor.data?.description && (
                                                    <div className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                                                        {monitor.data.description}
                                                    </div>
                                                )}
                                                {monitor.exception_message && (
                                                    <div className="text-xs text-red-500 mt-1 line-clamp-2" title={monitor.exception_message}>
                                                        {monitor.exception_message}
                                                    </div>
                                                )}
                                                {monitor.data?.triggered_by && (
                                                    <div className="text-xs text-blue-500 font-medium mt-1">
                                                        By: {monitor.data.triggered_by}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-600">
                                                    {monitor.queue || 'default'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge monitor={monitor} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {monitor.started_at ? new Date(monitor.started_at).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                                                {monitor.time_elapsed ? `${monitor.time_elapsed.toFixed(2)}s` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                                                {monitor.attempt}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Cancel — hanya untuk running */}
                                                    {isRunning(monitor) && (
                                                        <button
                                                            onClick={() => handleCancel(monitor)}
                                                            disabled={isActing}
                                                            title="Stop this job"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 dark:hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            {isActing
                                                                ? <Loader2 className="size-3.5 animate-spin" />
                                                                : <StopCircle className="size-3.5" />
                                                            }
                                                            Stop
                                                        </button>
                                                    )}
                                                    {/* Retry — hanya untuk failed */}
                                                    {isFailed(monitor) && (
                                                        <button
                                                            onClick={() => handleRetry(monitor)}
                                                            disabled={isActing}
                                                            title="Retry this job"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            {isActing
                                                                ? <Loader2 className="size-3.5 animate-spin" />
                                                                : <RotateCcw className="size-3.5" />
                                                            }
                                                            Retry
                                                        </button>
                                                    )}
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(monitor)}
                                                        disabled={isActing}
                                                        title="Delete record"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        {isActing
                                                            ? <Loader2 className="size-3.5 animate-spin" />
                                                            : <Trash2 className="size-3.5" />
                                                        }
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination />
            </div>
        </div>
    );
}
