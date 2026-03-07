import { useMemo } from 'react';
import { QuestionOption } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ArrangeWordsDisplayProps {
    options: QuestionOption[];
}

export default function ArrangeWordsDisplay({ options }: ArrangeWordsDisplayProps) {
    const option = options?.[0];
    const isArabic = !!option?.metadata?.is_arabic;
    const delimiter = option?.metadata?.delimiter || ' ';
    const shuffleMode = option?.metadata?.shuffle_mode || 'phrase';

    const words = useMemo(() => {
        if (!option?.content) return [];
        if (shuffleMode === 'alphabet') {
            return option.content.replace(/\s/g, '').split('');
        }
        return option.content.split(delimiter).filter(Boolean);
    }, [option?.content, delimiter, shuffleMode]);

    return (
        <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Sparkles className="size-3" />
                    Kunci Jawaban (Urutan Benar)
                </h4>

                <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                    {words.map((word, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className={cn(
                                "px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-sm",
                                isArabic && "font-arabic"
                            )}>
                                {word}
                            </span>
                            {i < words.length - 1 && (
                                <ArrowRight className={cn("size-3 text-slate-300 dark:text-slate-600", isArabic && "rotate-180")} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
                Siswa harus menyusun kata-kata di atas secara berurutan.
            </p>
        </div>
    );
}
