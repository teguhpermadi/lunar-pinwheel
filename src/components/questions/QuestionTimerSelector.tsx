import { useState, useRef, useEffect } from 'react';
import { questionApi } from '@/lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionTimerSelectorProps {
    questionId?: string;
    initialTimer: number;
    onTimerChange?: (newTimer: number) => void;
    disabled?: boolean;
    manual?: boolean;
}

// Mapped from App\Enums\QuestionTimeEnum
const timerOptions = [
    { value: 5000, label: '5 Detik' },
    { value: 10000, label: '10 Detik' },
    { value: 30000, label: '30 Detik' },
    { value: 45000, label: '45 Detik' },
    { value: 60000, label: '1 Menit' },
    { value: 90000, label: '1.5 Menit' },
    { value: 120000, label: '2 Menit' },
    { value: 180000, label: '3 Menit' },
    { value: 300000, label: '5 Menit' },
    { value: 600000, label: '10 Menit' },
    { value: 900000, label: '15 Menit' },
];

export default function QuestionTimerSelector({ questionId, initialTimer, onTimerChange, disabled = false, manual = false }: QuestionTimerSelectorProps) {
    const [timer, setTimer] = useState<number>(initialTimer);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Sync prop changes
    useEffect(() => {
        setTimer(initialTimer);
    }, [initialTimer]);

    const handleSelect = async (newTimer: number) => {
        if (newTimer === timer) {
            setIsOpen(false);
            return;
        }

        const oldTimer = timer;
        setTimer(newTimer);
        setIsOpen(false);
        if (manual) {
            if (onTimerChange) {
                onTimerChange(newTimer);
            }
            setIsOpen(false);
            return;
        }

        setIsLoading(true);

        try {
            if (!questionId) throw new Error("Question ID is required for automatic updates");
            const response = await questionApi.updateQuestion(questionId, { timer: newTimer });

            if (response.success) {
                if (onTimerChange) {
                    onTimerChange(newTimer);
                }

                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    }
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Timer updated'
                });

            } else {
                throw new Error(response.message || 'Failed to update');
            }

        } catch (error) {
            console.error("Failed to update timer", error);
            setTimer(oldTimer); // Revert
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to update',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to format display
    const formatLabel = (val: number) => {
        const option = timerOptions.find(o => o.value === val);
        if (option) return option.label;
        // Fallback formatting if value doesn't match enum perfectly
        if (val < 60000) return `${val / 1000}s`;
        return `${val / 60000}m`;
    };

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => !isLoading && !disabled && setIsOpen(!isOpen)}
                className={`
                    group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-200 outline-none
                    bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800
                    ${disabled ? 'opacity-80 cursor-default' : 'hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'}
                    ${isLoading ? 'opacity-70 cursor-wait' : ''}
                    ${isOpen ? 'ring-2 ring-offset-1 ring-primary/20 dark:ring-offset-slate-900' : ''}
                `}
                disabled={isLoading || disabled}
            >
                {isLoading ? (
                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                ) : (
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                )}
                <span>{formatLabel(timer)}</span>
                {!disabled && (
                    <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 top-full left-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden"
                    >
                        <div className="p-1 space-y-0.5 max-h-60 overflow-y-auto">
                            {timerOptions.map((option) => {
                                const isActive = option.value === timer;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                            ${isActive
                                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{option.label}</span>
                                        </div>
                                        {isActive && (
                                            <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
