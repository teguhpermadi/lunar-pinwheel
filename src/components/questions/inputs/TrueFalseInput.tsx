import { useState } from 'react';

interface Option {
    id?: string;
    key: string;
    content: string; // "True" or "False"
    is_correct: boolean;
    uuid: string;
}

interface TrueFalseInputProps {
    options: Option[];
    onChange: (options: Option[]) => void;
}

export default function TrueFalseInput({ options, onChange }: TrueFalseInputProps) {
    // Ensure we have True and False options initialized
    // Usually T/F questions have fixed options, but we manage them as options array for consistency

    const handleSelect = (key: string) => {
        // key is "True" or "False" (or simplified as A/B hiddenly)
        // Let's assume content is the key for T/F

        const newOptions = options.map(opt => ({
            ...opt,
            is_correct: opt.content === key
        }));
        onChange(newOptions);
    };

    const isTrueCorrect = options.find(o => o.content === 'True')?.is_correct;
    const isFalseCorrect = options.find(o => o.content === 'False')?.is_correct;

    return (
        <section className="space-y-6">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Correct Answer</label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleSelect('True')}
                    className={`
                        relative group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200 
                        ${isTrueCorrect
                            ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200 hover:bg-emerald-50/30'
                        }
                    `}
                >
                    {isTrueCorrect && (
                        <div className="absolute top-4 right-4">
                            <span className="material-symbols-outlined text-emerald-500 text-3xl font-bold">check_circle</span>
                        </div>
                    )}

                    <div className={`size-20 rounded-full flex items-center justify-center ${isTrueCorrect ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-5xl">task_alt</span>
                    </div>
                    <span className={`text-xl font-bold ${isTrueCorrect ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>True</span>
                </button>

                <button
                    onClick={() => handleSelect('False')}
                    className={`
                        relative group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200 
                        ${isFalseCorrect
                            ? 'bg-white dark:bg-slate-900 border-red-500 shadow-lg shadow-red-500/10'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-200 hover:bg-red-50/30'
                        }
                    `}
                >
                    {isFalseCorrect && (
                        <div className="absolute top-4 right-4">
                            <span className="material-symbols-outlined text-red-500 text-3xl font-bold">check_circle</span>
                        </div>
                    )}

                    <div className={`size-20 rounded-full flex items-center justify-center ${isFalseCorrect ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-5xl">cancel</span>
                    </div>
                    <span className={`text-xl font-bold ${isFalseCorrect ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>False</span>
                </button>
            </div>
        </section>
    );
}
