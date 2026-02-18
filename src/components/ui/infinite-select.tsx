import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteSelectProps<T> {
    value?: string;
    onChange: (value: string) => void;
    fetchData: (params: { page: number; search: string }) => Promise<{
        data: T[];
        hasMore: boolean;
    }>;
    labelKey: keyof T;
    valueKey: keyof T;
    placeholder?: string;
    disabled?: boolean;
    initialData?: T;
}

export default function InfiniteSelect<T extends { id: string }>({
    value,
    onChange,
    fetchData,
    labelKey,
    valueKey,
    placeholder = 'Select option...',
    disabled = false,
    initialData
}: InfiniteSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<T[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(initialData || null);

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        if (isOpen && options.length === 0) {
            loadOptions(1, '', true);
        }
    }, [isOpen]);

    // Handle initial data
    useEffect(() => {
        if (initialData) {
            setSelectedItem(initialData);
        }
    }, [initialData]);

    const loadOptions = async (pageNum: number, searchQuery: string, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const { data, hasMore: more } = await fetchData({ page: pageNum, search: searchQuery });

            setOptions(prev => {
                if (reset) return data;
                // De-duplicate
                const ids = new Set(prev.map(o => o[valueKey]));
                const newOptions = data.filter(o => !ids.has(o[valueKey] as any));
                return [...prev, ...newOptions];
            });

            setHasMore(more);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to load options", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            loadOptions(1, search, true);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Infinite scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
            loadOptions(page + 1, search);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: T) => {
        setSelectedItem(item);
        onChange(String(item[valueKey]));
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isOpen
                    ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex-1 truncate">
                    {selectedItem ? (
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {String(selectedItem[labelKey])}
                        </span>
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                            {placeholder}
                        </span>
                    )}
                </div>
                <span className="material-symbols-outlined text-slate-400">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                    >
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <span className="material-symbols-outlined text-lg">search</span>
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div
                            ref={dropdownRef}
                            onScroll={handleScroll}
                            className="max-h-60 overflow-y-auto p-1"
                        >
                            {options.length === 0 && !loading ? (
                                <div className="p-4 text-center text-sm text-slate-400">
                                    No options found
                                </div>
                            ) : (
                                options.map((item, index) => (
                                    <button
                                        type="button"
                                        key={`${String(item[valueKey])}-${index}`}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${value === String(item[valueKey])
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <span>{String(item[labelKey])}</span>
                                        {value === String(item[valueKey]) && (
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        )}
                                    </button>
                                ))
                            )}

                            {loading && (
                                <div className="p-2 text-center">
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
