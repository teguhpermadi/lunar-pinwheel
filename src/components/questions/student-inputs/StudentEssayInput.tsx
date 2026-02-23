import { useState, useEffect } from 'react';

interface StudentEssayInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
}

export default function StudentEssayInput({ selectedAnswer, onChange }: StudentEssayInputProps) {
    const [value, setValue] = useState(selectedAnswer || '');

    useEffect(() => {
        setValue(selectedAnswer || '');
    }, [selectedAnswer]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        onChange(value);
    };

    return (
        <div className="space-y-2">
            <textarea
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Write your answer here..."
                className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all custom-scrollbar resize-none"
            />
            <div className="flex justify-between text-xs text-gray-400 px-2 font-medium">
                <span>Characters: {value.length}</span>
                <span>Words: {value.trim() ? value.trim().split(/\s+/).length : 0}</span>
            </div>
        </div>
    );
}
