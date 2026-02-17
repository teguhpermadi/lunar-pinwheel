import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function AcademicYearSelector() {
    const { academicYears, selectedYearId, setSelectedYearId, isLoading: isContextLoading, loadMore, hasMore } = useAcademicYear();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const selectedYear = academicYears.find(y => y.id === selectedYearId);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 20 && hasMore && !isLoadingMore) {
            setIsLoadingMore(true);
            await loadMore();
            setIsLoadingMore(false);
        }
    };

    if (isContextLoading && academicYears.length === 0) {
        return (
            <div className="w-48 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        );
    }

    return (
        <div className="relative w-full md:w-64" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <div className="flex flex-col items-start truncate">
                        <span className="text-xs text-slate-500 font-medium tracking-wide">Academic Year</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {selectedYear ? `${selectedYear.year} - ${selectedYear.semester}` : 'Select Year'}
                        </span>
                    </div>
                </div>
                <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 py-1"
                    >
                        <div
                            ref={listRef}
                            onScroll={handleScroll}
                            className="max-h-64 overflow-y-auto custom-scrollbar"
                        >
                            {academicYears.length > 0 ? (
                                <>
                                    {academicYears.map((year) => (
                                        <button
                                            key={year.id}
                                            onClick={() => {
                                                setSelectedYearId(year.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${selectedYearId === year.id
                                                ? 'bg-primary/5 text-primary'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{year.year}</span>
                                                <span className="text-xs opacity-70">Semester {year.semester}</span>
                                            </div>
                                            {selectedYearId === year.id && (
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            )}
                                        </button>
                                    ))}
                                    {hasMore && (
                                        <div className="py-2 text-center text-xs text-slate-400">
                                            {isLoadingMore ? 'Loading more...' : 'Scroll for more'}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                    No academic years found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
