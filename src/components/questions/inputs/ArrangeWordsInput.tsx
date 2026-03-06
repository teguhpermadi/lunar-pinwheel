import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ArrangeWordsInputProps {
    sentence: string;
    onSentenceChange: (sentence: string) => void;
    delimiter: string;
    onDelimiterChange: (delimiter: string) => void;
    isArabic: boolean;
    onIsArabicChange: (isArabic: boolean) => void;
    shuffleMode: 'phrase' | 'alphabet';
    onShuffleModeChange: (mode: 'phrase' | 'alphabet') => void;
}

export default function ArrangeWordsInput({ 
    sentence, 
    onSentenceChange, 
    delimiter, 
    onDelimiterChange,
    isArabic,
    onIsArabicChange,
    shuffleMode,
    onShuffleModeChange
}: ArrangeWordsInputProps) {
    return (
        <section className="space-y-6">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Konfigurasi Susun Kata</label>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-500 flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-500 text-3xl">sort_by_alpha</span>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Arrange Words</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Masukkan kalimat atau kumpulan kata yang benar. Kata-kata akan diacak secara otomatis berdasarkan pemisah (delimiter).
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center gap-4 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isArabic"
                            checked={isArabic}
                            onChange={(e) => onIsArabicChange(e.target.checked)}
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="isArabic" className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                            <span className="material-icons text-sm">translate</span>
                            Teks Arab (RTL)
                        </label>
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Mode Acak:</span>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="shuffleMode"
                                    checked={shuffleMode === 'phrase'}
                                    onChange={() => onShuffleModeChange('phrase')}
                                    className="size-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Frasa/Kata</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="shuffleMode"
                                    checked={shuffleMode === 'alphabet'}
                                    onChange={() => onShuffleModeChange('alphabet')}
                                    className="size-4 border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Alfabet</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Input
                        label="Kalimat Lengkap (Urutan Benar)"
                        value={sentence}
                        onChange={(e) => onSentenceChange(e.target.value)}
                        placeholder="Contoh: Saya sedang belajar React"
                        className={cn("text-lg py-6", isArabic && "text-right font-arabic")}
                        dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>

                <div className="space-y-2">
                    <Input
                        label="Pemisah Kata (Delimiter)"
                        value={delimiter}
                        onChange={(e) => onDelimiterChange(e.target.value)}
                        placeholder="Default adalah spasi"
                        className="max-w-[100px]"
                    />
                    <p className="text-xs text-slate-400 italic">Gunakan spasi atau karakter lain (misal: | atau ,) untuk memisahkan kata/frasa.</p>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pratinjau Kata (Acak)</h4>
                <div className={cn("flex flex-wrap gap-2", isArabic && "flex-row-reverse")}>
                    {sentence.trim() ? (
                        (shuffleMode === 'phrase' 
                            ? sentence.split(delimiter || ' ').filter(Boolean)
                            : sentence.replace(/\s/g, '').split('')
                        )
                            .sort(() => Math.random() - 0.5) // Just a visual random for preview
                            .map((word, i) => (
                                <span key={i} className={cn(
                                    "px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm shadow-sm",
                                    isArabic && "font-arabic"
                                )}>
                                    {word}
                                </span>
                            ))
                    ) : (
                        <span className="text-slate-400 text-sm italic">Belum ada kata...</span>
                    )}
                </div>
            </div>
        </section>
    );
}
