import { Input } from '@/components/ui/input';

interface ArrangeWordsInputProps {
    sentence: string;
    onSentenceChange: (sentence: string) => void;
    delimiter: string;
    onDelimiterChange: (delimiter: string) => void;
}

export default function ArrangeWordsInput({ 
    sentence, 
    onSentenceChange, 
    delimiter, 
    onDelimiterChange 
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
                <div className="space-y-2">
                    <Input
                        label="Kalimat Lengkap (Urutan Benar)"
                        value={sentence}
                        onChange={(e) => onSentenceChange(e.target.value)}
                        placeholder="Contoh: Saya sedang belajar React"
                        className="text-lg py-6"
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
                <div className="flex flex-wrap gap-2">
                    {sentence.trim() ? (
                        sentence.split(delimiter || ' ')
                            .filter(Boolean)
                            .sort(() => Math.random() - 0.5) // Just a visual random for preview
                            .map((word, i) => (
                                <span key={i} className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm shadow-sm">
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
