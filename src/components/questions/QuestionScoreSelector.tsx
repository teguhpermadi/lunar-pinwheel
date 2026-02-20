import { useState, useRef, useEffect } from 'react';
import { questionApi } from '@/lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionScoreSelectorProps {
    questionId?: string;
    initialScore: number;
    onScoreChange?: (newScore: number) => void;
    disabled?: boolean;
    manual?: boolean;
}

// Mapped from App\Enums\QuestionScoreEnum
// Assuming values 1-5 as per the enum file provided
const scoreOptions = [
    { value: 1, label: '1 Poin' },
    { value: 2, label: '2 Poin' },
    { value: 3, label: '3 Poin' },
    { value: 4, label: '4 Poin' },
    { value: 5, label: '5 Poin' },
];

export default function QuestionScoreSelector({ questionId, initialScore, onScoreChange, disabled = false, manual = false }: QuestionScoreSelectorProps) {
    const [score, setScore] = useState<number>(initialScore);
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
        setScore(initialScore);
    }, [initialScore]);

    const handleSelect = async (newScore: number) => {
        if (newScore === score) {
            setIsOpen(false);
            return;
        }

        const oldScore = score;
        setScore(newScore);
        setIsOpen(false);
        if (manual) {
            if (onScoreChange) {
                onScoreChange(newScore);
            }
            setIsOpen(false);
            return;
        }

        setIsLoading(true);

        try {
            if (!questionId) throw new Error("Question ID is required for automatic updates");
            const response = await questionApi.updateQuestion(questionId, { score: newScore });

            if (response.success) {
                if (onScoreChange) {
                    onScoreChange(newScore);
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
                    title: 'Score updated'
                });

            } else {
                throw new Error(response.message || 'Failed to update');
            }

        } catch (error) {
            console.error("Failed to update score", error);
            setScore(oldScore); // Revert
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

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => !isLoading && !disabled && setIsOpen(!isOpen)}
                className={`
                    group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-200 outline-none
                    bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800
                    ${disabled ? 'opacity-80 cursor-default' : 'hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer'}
                    ${isLoading ? 'opacity-70 cursor-wait' : ''}
                    ${isOpen ? 'ring-2 ring-offset-1 ring-primary/20 dark:ring-offset-slate-900' : ''}
                `}
                disabled={isLoading || disabled}
            >
                {isLoading ? (
                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                ) : (
                    <span className="material-symbols-outlined text-[14px]">grade</span>
                )}
                <span>{score} pts</span>
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
                        className="absolute z-50 top-full left-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden"
                    >
                        <div className="p-1 space-y-0.5">
                            {scoreOptions.map((option) => {
                                const isActive = option.value === score;
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
