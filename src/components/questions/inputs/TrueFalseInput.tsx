import { useState } from 'react';

interface Option {
    id?: string;
    key: string;
    content: string;
    is_correct: boolean;
    uuid: string;
}

interface TrueFalseInputProps {
    options: Option[];
    onChange: (options: Option[]) => void;
}

// Config per index position: first option = "true" style, second = "false" style
const OPTION_STYLES = [
    {
        icon: 'task_alt',
        activeColor: {
            border: 'border-emerald-500 shadow-lg shadow-emerald-500/10',
            check: 'text-emerald-500',
            circle: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600',
            text: 'text-slate-800 dark:text-slate-100',
        },
        hoverColor: 'hover:border-emerald-200 hover:bg-emerald-50/30',
    },
    {
        icon: 'cancel',
        activeColor: {
            border: 'border-red-500 shadow-lg shadow-red-500/10',
            check: 'text-red-500',
            circle: 'bg-red-100 dark:bg-red-500/20 text-red-500',
            text: 'text-slate-800 dark:text-slate-100',
        },
        hoverColor: 'hover:border-red-200 hover:bg-red-50/30',
    },
];

export default function TrueFalseInput({ options, onChange }: TrueFalseInputProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleSelect = (index: number) => {
        // Don't select when editing label
        if (editingIndex !== null) return;

        const newOptions = options.map((opt, i) => ({
            ...opt,
            is_correct: i === index,
        }));
        onChange(newOptions);
    };

    const handleContentChange = (index: number, value: string) => {
        const newOptions = options.map((opt, i) =>
            i === index ? { ...opt, content: value } : opt
        );
        onChange(newOptions);
    };

    return (
        <section className="space-y-6">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Correct Answer</label>
            <div className="grid grid-cols-2 gap-4">
                {options.slice(0, 2).map((opt, index) => {
                    const style = OPTION_STYLES[index] ?? OPTION_STYLES[0];
                    const isCorrect = opt.is_correct;
                    const isEditing = editingIndex === index;

                    return (
                        <button
                            key={opt.uuid}
                            type="button"
                            onClick={() => handleSelect(index)}
                            className={`
                                relative group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200 
                                ${isCorrect
                                    ? `bg-white dark:bg-slate-900 ${style.activeColor.border}`
                                    : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${style.hoverColor}`
                                }
                            `}
                        >
                            {isCorrect && (
                                <div className="absolute top-4 right-4">
                                    <span className={`material-symbols-outlined ${style.activeColor.check} text-3xl font-bold`}>check_circle</span>
                                </div>
                            )}

                            <div className={`size-20 rounded-full flex items-center justify-center ${isCorrect ? style.activeColor.circle : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-5xl">{style.icon}</span>
                            </div>

                            {isEditing ? (
                                <input
                                    type="text"
                                    value={opt.content}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleContentChange(index, e.target.value)}
                                    onBlur={() => setEditingIndex(null)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') setEditingIndex(null);
                                    }}
                                    className="text-xl font-bold text-center bg-transparent border-b-2 border-slate-300 dark:border-slate-600 outline-none focus:border-blue-500 w-full max-w-[160px] text-slate-800 dark:text-slate-100"
                                />
                            ) : (
                                <span
                                    className={`text-xl font-bold cursor-text ${isCorrect ? style.activeColor.text : 'text-slate-400'}`}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingIndex(index);
                                    }}
                                    title="Double-click to edit"
                                >
                                    {opt.content}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-slate-400 text-center italic">Double-click label to edit</p>
        </section>
    );
}
