import { useState, useRef, useEffect } from 'react';
import { questionApi } from '@/lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionDifficultySelectorProps {
    questionId: string;
    initialDifficulty: string;
    onDifficultyChange?: (newDifficulty: string) => void;
}

const difficultyConfig = {
    mudah: {
        label: 'Mudah',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
        hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
        icon: 'sentiment_satisfied'
    },
    sedang: {
        label: 'Sedang',
        color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
        icon: 'sentiment_neutral'
    },
    sulit: {
        label: 'Sulit',
        color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
        hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40',
        icon: 'sentiment_very_dissatisfied'
    }
};

type DifficultyKey = keyof typeof difficultyConfig;

export default function QuestionDifficultySelector({ questionId, initialDifficulty, onDifficultyChange }: QuestionDifficultySelectorProps) {
    const [difficulty, setDifficulty] = useState<DifficultyKey>(initialDifficulty as DifficultyKey || 'mudah');
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
        if (initialDifficulty && difficultyConfig[initialDifficulty as DifficultyKey]) {
            setDifficulty(initialDifficulty as DifficultyKey);
        }
    }, [initialDifficulty]);

    const handleSelect = async (newDifficulty: DifficultyKey) => {
        if (newDifficulty === difficulty) {
            setIsOpen(false);
            return;
        }

        const oldDifficulty = difficulty;
        setDifficulty(newDifficulty);
        setIsOpen(false);
        setIsLoading(true);

        try {
            const response = await questionApi.updateQuestion(questionId, { difficulty: newDifficulty });

            if (response.success) {
                if (onDifficultyChange) {
                    onDifficultyChange(newDifficulty);
                }

                // Subtle toast
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
                    title: 'Difficulty updated'
                });

            } else {
                throw new Error(response.message || 'Failed to update');
            }

        } catch (error) {
            console.error("Failed to update difficulty", error);
            setDifficulty(oldDifficulty); // Revert
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

    const currentConfig = difficultyConfig[difficulty] || difficultyConfig['mudah'];

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => !isLoading && setIsOpen(!isOpen)}
                className={`
                    group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-200 outline-none
                    ${currentConfig.color}
                    ${currentConfig.hover}
                    ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-offset-1 ring-primary/20 dark:ring-offset-slate-900' : ''}
                `}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                ) : (
                    <span className="material-symbols-outlined text-[14px]">{currentConfig.icon}</span>
                )}
                <span>{currentConfig.label}</span>
                <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 top-full left-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden"
                    >
                        <div className="p-1 space-y-0.5">
                            {(Object.keys(difficultyConfig) as DifficultyKey[]).map((key) => {
                                const config = difficultyConfig[key];
                                const isActive = key === difficulty;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleSelect(key)}
                                        className={`
                                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                            ${isActive
                                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${key === 'mudah' ? 'bg-emerald-500' :
                                                    key === 'sedang' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}></span>
                                            {config.label}
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
