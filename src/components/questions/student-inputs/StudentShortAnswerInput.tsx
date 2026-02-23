import { useState, useEffect } from 'react';

interface StudentShortAnswerInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
}

export default function StudentShortAnswerInput({ selectedAnswer, onChange }: StudentShortAnswerInputProps) {
    const [value, setValue] = useState(selectedAnswer || '');

    useEffect(() => {
        setValue(selectedAnswer || '');
    }, [selectedAnswer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        onChange(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onChange(value);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative group">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your short answer here..."
                    className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xl font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm group-hover:border-primary/30"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">edit_note</span>
                </div>
            </div>
            <p className="text-sm text-gray-400 italic px-2">
                Make sure your spelling and punctuation are correct.
            </p>
        </div>
    );
}
