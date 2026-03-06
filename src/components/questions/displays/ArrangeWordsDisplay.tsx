import { QuestionOption } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ArrangeWordsDisplayProps {
    options: QuestionOption[];
}

export default function ArrangeWordsDisplay({ options }: ArrangeWordsDisplayProps) {
    const option = options?.[0];
    const isArabic = !!option?.metadata?.is_arabic;
    const delimiter = option?.metadata?.delimiter || ' ';
    const words = option?.content ? option.content.split(delimiter).filter(Boolean) : [];

    return (
        <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="material-icons text-xs">auto_awesome</span>
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
                                <span className={cn("material-icons text-slate-300 dark:text-slate-600 text-xs", isArabic && "rotate-180")}>
                                    arrow_forward
                                </span>
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
