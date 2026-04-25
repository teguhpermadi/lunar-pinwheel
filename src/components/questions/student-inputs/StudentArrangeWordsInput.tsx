import { useState, useEffect, useMemo } from 'react';
import { QuestionOption } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, RotateCcw, Type, LayoutGrid, CheckCircle2 } from 'lucide-react';

interface StudentArrangeWordsInputProps {
    options: QuestionOption[];
    selectedAnswer: string[] | null;
    onChange: (value: string[]) => void;
    showAnswer?: boolean;
    keyAnswer?: {
        words?: string[];
    };
}

export default function StudentArrangeWordsInput({ options, selectedAnswer, onChange, showAnswer, keyAnswer }: StudentArrangeWordsInputProps) {
    const option = options[0];
    const isArabic = !!option?.metadata?.is_arabic;
    const delimiter = option?.metadata?.delimiter || ' ';
    const shuffleMode = option?.metadata?.shuffle_mode || 'phrase';

    const correctOrder = keyAnswer?.words || [];

    // Full list of words in correct order (from server content)
    const allWords = useMemo(() => {
        if (!option?.content) return [];
        if (shuffleMode === 'alphabet') {
            return option.content.replace(/\s/g, '').split('');
        }
        return option.content.split(delimiter).filter(Boolean);
    }, [option?.content, delimiter, shuffleMode]);

    const [myAnswer, setMyAnswer] = useState<string[]>(selectedAnswer || []);

    // Words that haven't been picked yet
    const [availableWords, setAvailableWords] = useState<string[]>([]);

    useEffect(() => {
        // Calculate which words are still available
        let remaining = [...allWords];
        if (selectedAnswer && selectedAnswer.length > 0) {
            selectedAnswer.forEach(word => {
                const idx = remaining.indexOf(word);
                if (idx !== -1) {
                    remaining.splice(idx, 1);
                }
            });
            setMyAnswer(selectedAnswer);
        } else {
            // Initial load with no answer: shuffle all words
            remaining.sort(() => Math.random() - 0.5);
            setMyAnswer([]);
        }
        setAvailableWords(remaining);
    }, [allWords, selectedAnswer]);

    const handlePickWord = (word: string, index: number) => {
        const newAvailable = [...availableWords];
        newAvailable.splice(index, 1);
        setAvailableWords(newAvailable);

        const newAnswer = [...myAnswer, word];
        setMyAnswer(newAnswer);
        onChange(newAnswer);
    };

    const handleRemoveWord = (index: number) => {
        const word = myAnswer[index];
        const newAnswer = [...myAnswer];
        newAnswer.splice(index, 1);
        setMyAnswer(newAnswer);
        onChange(newAnswer);

        // Put back to available (shuffled or at end)
        setAvailableWords([...availableWords, word]);
    };

    const handleReset = () => {
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        setAvailableWords(shuffled);
        setMyAnswer([]);
        onChange([]);
    };

    const hasCorrectAnswer = correctOrder.length > 0;

    return (
        <div className="space-y-8">
            {showAnswer && hasCorrectAnswer && (
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 space-y-2">
                    <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="size-4" />
                        Urutan Jawaban Benar
                    </div>
                    <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                        {correctOrder.map((word, idx) => (
                            <span
                                key={`correct-${idx}`}
                                className={cn(
                                    "px-3 py-1.5 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-600 rounded-lg text-sm font-bold text-green-700 dark:text-green-300",
                                    shuffleMode === 'alphabet' && "px-2 min-w-[32px] justify-center",
                                    isArabic && "font-arabic"
                                )}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Answer Area */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Type className="size-4" />
                        Susun jawaban Anda di sini:
                    </p>
                    {myAnswer.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw className="size-3" />
                            Reset
                        </button>
                    )}
                </div>

                <div className={cn(
                    "min-h-[80px] p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap gap-2 transition-all",
                    myAnswer.length > 0 ? "border-primary/20 bg-primary/5 dark:bg-primary/5" : "",
                    isArabic && "flex-row-reverse"
                )}>
                    <AnimatePresence mode="popLayout">
                        {myAnswer.map((word, idx) => (
                            <motion.button
                                key={`ans-${word}-${idx}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => handleRemoveWord(idx)}
                                className={cn(
                                    "group relative px-4 py-2 bg-white dark:bg-slate-800 border border-primary/20 dark:border-primary/40 rounded-xl shadow-sm text-sm md:text-base font-bold text-primary flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 transition-colors",
                                    shuffleMode === 'alphabet' && "px-3 min-w-[40px] justify-center",
                                    isArabic && "font-arabic"
                                )}
                            >
                                {word}
                                <X className={cn("size-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-500", shuffleMode === 'alphabet' && "hidden md:block")} />
                            </motion.button>
                        ))}
                    </AnimatePresence>
                    {myAnswer.length === 0 && (
                        <div className="w-full flex items-center justify-center text-slate-300 dark:text-slate-700 italic text-sm text-center">
                            {shuffleMode === 'alphabet' ? 'Klik huruf-huruf di bawah untuk mulai menyusun...' : 'Klik kata-kata di bawah untuk mulai menyusun...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Source Pool */}
            <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid className="size-4" />
                    {shuffleMode === 'alphabet' ? 'Huruf tersedia:' : 'Kata-kata tersedia:'}
                </p>

                <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                    <AnimatePresence mode="popLayout">
                        {availableWords.map((word, idx) => (
                            <motion.button
                                key={`pool-${word}-${idx}`}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePickWord(word, idx)}
                                className={cn(
                                    "px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm md:text-base font-medium text-slate-700 dark:text-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all",
                                    shuffleMode === 'alphabet' && "px-3 min-w-[40px] justify-center",
                                    isArabic && "font-arabic"
                                )}
                            >
                                {word}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

                {availableWords.length === 0 && myAnswer.length > 0 && (
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg w-fit">
                        <CheckCircle2 className="size-4" />
                        Semua kata telah dipilih
                    </div>
                )}
            </div>
        </div>
    );
}
