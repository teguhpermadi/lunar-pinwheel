import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

interface ArabicKeyProps {
    label: string;
    onClick: (char: string) => void;
    className?: string;
}

const ArabicKey = ({ label, onClick, className = "" }: ArabicKeyProps) => {
    return (
        <button
            type="button"
            onClick={() => onClick(label)}
            className={`flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-2xl font-arabic hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary/50 transition-all cursor-pointer aspect-square sm:aspect-auto min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        >
            {label}
        </button>
    );
};

interface ArabicKeyboardProps {
    onKeyClick: (char: string) => void;
    onBackspace: () => void;
    onSpace: () => void;
}

export default function ArabicKeyboard({ onKeyClick, onBackspace, onSpace }: ArabicKeyboardProps) {
    const [activeTab, setActiveTab] = useState<'main' | 'lafadz' | 'symbols'>('main');

    const tabs = [
        { id: 'main', label: 'Huruf & Harakat' },
        { id: 'lafadz', label: 'Lafadz' },
        { id: 'symbols', label: 'Angka & Simbol' },
    ];


    const keys = {
        main: [
            // Harakat (top row)
            'َ', 'ُ', 'ِ', 'ً', 'ٌ', 'ٍ', 'ْ', 'ّ', 'ٰ', 'ـ',
            // Letters
            'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د',
            'ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط',
            'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ',
            'أ', 'إ', 'آ', 'ٱ'
        ],
        lafadz: [
            'ﷲ', 'ﷴ', 'ﷺ', 'ﷻ', 
        ],
        symbols: [
            '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩',
            '.', ',', '!', ':', ';', '(', ')', '[', ']', '{', '}', '،', '؟'
        ]

    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 w-full" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-widest font-arabic">الكيبورد العربي</span>
            </div>

            <div className="relative min-h-[180px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2">
                            {keys[activeTab].map((char, idx) => (
                                <ArabicKey
                                    key={`${activeTab}-${idx}`}
                                    label={char}
                                    onClick={onKeyClick}
                                    className={`${idx < 10 && activeTab === 'main' ? "bg-slate-50 dark:bg-slate-800/50 font-bold" : ""} ${activeTab === 'lafadz' ? "text-3xl" : ""}`}
                                />
                            ))}


                            {/* Special Actions */}
                            <button
                                type="button"
                                onClick={onSpace}
                                className="col-span-2 sm:col-span-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all min-h-[50px]"
                            >
                                Spasi
                            </button>

                            <button
                                type="button"
                                onClick={onBackspace}
                                className="col-span-2 sm:col-span-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30 flex items-center justify-center p-2 rounded-lg border min-h-[50px]"
                            >
                                <Delete size={18} className="ml-2" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Hapus</span>
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
