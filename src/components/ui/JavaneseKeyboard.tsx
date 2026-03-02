import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

interface JavaneseKeyProps {
    label: string;
    onClick: (char: string) => void;
    className?: string;
}

const JavaneseKey = ({ label, onClick, className = "" }: JavaneseKeyProps) => {
    return (
        <button
            type="button"
            onClick={() => onClick(label)}
            className={`flex items-center justify-center p-1 sm:p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-2xl sm:text-3xl font-javanese hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary/50 transition-all cursor-pointer aspect-square sm:aspect-auto min-h-[40px] sm:min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        >
            {label}
        </button>
    );
};

interface JavaneseKeyboardProps {
    onKeyClick: (char: string) => void;
    onBackspace: () => void;
    onSpace: () => void;
}

export default function JavaneseKeyboard({ onKeyClick, onBackspace, onSpace }: JavaneseKeyboardProps) {
    const [activeTab, setActiveTab] = useState<'aksara' | 'pasangan' | 'sandangan' | 'angka'>('aksara');

    const tabs = [
        { id: 'aksara', label: 'Aksara' },
        { id: 'pasangan', label: 'Pasangan' },
        { id: 'sandangan', label: 'Sandangan' },
        { id: 'angka', label: 'Angka & Simbol' },
    ];

    const keys = {
        aksara: [
            'ꦲ', 'ꦤ', 'ꦕ', 'ꦫ', 'ꦏ', // ha na ca ra ka
            'ꦢ', 'ꦠ', 'ꦱ', 'ꦮ', 'ꦭ', // da ta sa wa la
            'ꦥ', 'ꦝ', 'ꦗ', 'ꦪ', 'ꦚ', // pa dha ja ya nya
            'ꦩ', 'ꦒ', 'ꦧ', 'ꦛ', 'ꦔ', // ma ga ba tha nga
            'ꦶ', 'ꦸ', 'ꦺ', 'ꦼ', 'ꦴ', // wulu, suku, taling, pepet, tarung
            '꧀', 'ꦁ', 'ꦂ', 'ꦃ', 'ꦿ'  // pangkon, cecak, layar, wignyan, cakra
        ],
        pasangan: [
            '꧀ꦲ', '꧀ꦤ', '꧀ꦕ', '꧀ꦫ', '꧀ꦏ', // ha na ca ra ka
            '꧀ꦢ', '꧀ꦠ', '꧀ꦱ', '꧀ꦮ', '꧀ꦭ', // da ta sa wa la
            '꧀ꦥ', '꧀ꦝ', '꧀ꦗ', '꧀ꦪ', '꧀ꦚ', // pa dha ja ya nya
            '꧀ꦩ', '꧀ꦒ', '꧀ꦧ', '꧀ꦛ', '꧀ꦔ', // ma ga ba tha nga
            'ꦶ', 'ꦸ', 'ꦺ', 'ꦼ', 'ꦴ', // wulu, suku, taling, pepet, tarung
            '꧀', 'ꦁ', 'ꦂ', 'ꦃ', 'ꦿ'  // pangkon, cecak, layar, wignyan, cakra
        ],
        sandangan: [
            'ꦶ', 'ꦸ', 'ꦺ', 'ꦼ', 'ꦴ', // vowels
            'ꦻ', 'ꦽ', 'ꦾ', 'ꦿ', '꧀', // others
            'ꦀ', 'ꦁ', 'ꦂ', 'ꦃ', 'ꦄ', // more sandangan + swara A
            'ꦆ', 'ꦈ', 'ꦌ', 'ꦎ', 'ꦉ', // swara I, swara U, swara E, swara O, pa cerek
        ],
        angka: [
            '꧐', '꧑', '꧒', '꧓', '꧔', '꧕', '꧖', '꧗', '꧘', '꧙',
            '꧞', '꧟', '.', ',', '!', ':', ';', '(', ')', '?', '\"'
        ]
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 sm:pb-3">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto pb-1 sm:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-widest">Keyboard Aksara Jawa</span>
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
                        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5 sm:gap-2">
                            {keys[activeTab].map((char, idx) => (
                                <JavaneseKey
                                    key={`${activeTab}-${idx}`}
                                    label={char}
                                    onClick={onKeyClick}
                                />
                            ))}

                            {/* Special Actions */}
                            <button
                                type="button"
                                onClick={onSpace}
                                className="col-span-2 sm:col-span-3 md:col-span-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all min-h-[40px] sm:min-h-[50px]"
                            >
                                Spasi
                            </button>

                            <button
                                type="button"
                                onClick={onBackspace}
                                className="col-span-3 sm:col-span-4 md:col-span-5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30 flex items-center justify-center p-2 rounded-lg border min-h-[40px] sm:min-h-[50px]"
                            >
                                <Delete size={16} className="mr-1 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Hapus</span>
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
