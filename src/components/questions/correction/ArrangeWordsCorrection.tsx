import { useMemo } from 'react';
import { QuestionOption } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ArrangeWordsCorrectionProps {
    options: QuestionOption[];
    studentAnswer: string[]; // Array of words in student's chosen order
    keyAnswer?: any;
}

export default function ArrangeWordsCorrection({ options, studentAnswer = [] }: ArrangeWordsCorrectionProps) {
    const option = options?.[0];
    const isArabic = !!option?.metadata?.is_arabic;
    const delimiter = option?.metadata?.delimiter || ' ';
    const shuffleMode = option?.metadata?.shuffle_mode || 'phrase';

    const correctWords = useMemo(() => {
        if (!option?.content) return [];
        if (shuffleMode === 'alphabet') {
            return option.content.replace(/\s/g, '').split('');
        }
        return option.content.split(delimiter).filter(Boolean);
    }, [option?.content, delimiter, shuffleMode]);

    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Arrange Words Analysis</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Student Sequence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-indigo-500 text-sm">person</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student's Arrangement</span>
                    </div>
                    <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                        {studentAnswer && studentAnswer.length > 0 ? (
                            studentAnswer.map((word, index) => {
                                const isCorrectPos = correctWords[index] === word;

                                return (
                                    <div key={index} className={cn(
                                        "flex items-center gap-2 p-2 rounded-xl border-2 transition-all",
                                        isCorrectPos
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                                            : "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10"
                                    )}>
                                        <div className={cn(
                                            "size-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                            isCorrectPos ? "bg-emerald-500 text-white shadow-sm" : "bg-rose-500 text-white shadow-sm"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            isCorrectPos ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-300",
                                            isArabic && "font-arabic"
                                        )}>
                                            {word}
                                        </span>
                                        <span className={cn(
                                            "material-symbols-outlined text-base",
                                            isCorrectPos ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {isCorrectPos ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm italic">
                                No words arranged.
                            </div>
                        )}
                    </div>
                </div>

                {/* Correct Sequence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correct Order</span>
                    </div>
                    <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                        {correctWords.map((word, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm opacity-80">
                                <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-black shrink-0">
                                    {index + 1}
                                </div>
                                <span className={cn(
                                    "text-sm font-bold text-slate-600 dark:text-slate-400",
                                    isArabic && "font-arabic"
                                )}>
                                    {word}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
                Siswa harus mendapatkan urutan yang benar sesuai dengan kunci jawaban di atas.
            </p>
        </div>
    );
}
