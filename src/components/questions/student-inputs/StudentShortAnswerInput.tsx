import { useState, useEffect } from 'react';
import { PencilLine, CheckCircle2 } from 'lucide-react';

interface StudentShortAnswerInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
    showAnswer?: boolean;
    keyAnswer?: {
        answers?: string[];
    };
}

export default function StudentShortAnswerInput({ selectedAnswer, onChange, showAnswer, keyAnswer }: StudentShortAnswerInputProps) {
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

    const correctAnswers = keyAnswer?.answers || [];
    const hasCorrectAnswer = correctAnswers.length > 0;

    return (
        <div className="space-y-4">
            {showAnswer && hasCorrectAnswer && (
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 space-y-2">
                    <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="size-4" />
                        Jawaban Benar
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {correctAnswers.map((answer, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-600 rounded-lg text-sm font-medium text-green-700 dark:text-green-300"
                            >
                                {answer}
                            </span>
                        ))}
                    </div>
                </div>
            )}

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
                    <PencilLine className="size-5" />
                </div>
            </div>
            <p className="text-sm text-gray-400 italic px-2">
                Make sure your spelling and punctuation are correct.
            </p>
        </div>
    );
}
