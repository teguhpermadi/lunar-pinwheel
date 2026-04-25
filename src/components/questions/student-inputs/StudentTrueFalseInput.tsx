import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

export interface TrueFalseAnswer {
    option_key: string;
    reason: string | null;
}

interface StudentTrueFalseInputProps {
    options: { id: string; option_key: string; content: string | null; is_correct?: boolean }[];
    selectedAnswer: TrueFalseAnswer | string | null;
    onChange: (answer: TrueFalseAnswer) => void;
    showAnswer?: boolean;
}

export default function StudentTrueFalseInput({ options, selectedAnswer, onChange, showAnswer }: StudentTrueFalseInputProps) {
    const [localReason, setLocalReason] = useState<string>('');

    const selectedOptionKey = typeof selectedAnswer === 'string' 
        ? selectedAnswer 
        : selectedAnswer?.option_key || null;

    const existingReason = typeof selectedAnswer === 'object' && selectedAnswer !== null
        ? selectedAnswer.reason || ''
        : '';

    useEffect(() => {
        setLocalReason(existingReason);
    }, [existingReason]);

    const handleOptionSelect = (optionKey: string) => {
        onChange({
            option_key: optionKey,
            reason: localReason || null
        });
    };

    const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newReason = e.target.value;
        setLocalReason(newReason);
        if (selectedOptionKey) {
            onChange({
                option_key: selectedOptionKey,
                reason: newReason || null
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {options.map((option) => {
                    const isSelected = selectedOptionKey === option.option_key;
                    const isTrue = option.content?.toLowerCase() === 'true' || option.content?.toLowerCase() === 'benar';

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.option_key)}
                            className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                                showAnswer && option.is_correct
                                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/30'
                                    : isSelected
                                        ? (isTrue
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400')
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary grayscale-[0.5] hover:grayscale-0 bg-white dark:bg-gray-800'
                            }`}
                        >
                            {isTrue ? (
                                <CheckCircle2 className="size-10 md:size-12 mb-2 md:mb-3" />
                            ) : (
                                <XCircle className="size-10 md:size-12 mb-2 md:mb-3" />
                            )}
                            <span className="text-lg md:text-xl font-bold uppercase tracking-wider">{option.content}</span>
                        </button>
                    );
                })}
            </div>

            {selectedOptionKey && (
                <div className="animate-fade-in">
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <MessageSquare className="size-4" />
                        <span>Alasan</span>
                    </label>
                    <textarea
                        value={localReason}
                        onChange={handleReasonChange}
                        placeholder="Tulis alasan mengapa Anda memilih jawaban tersebut..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            focus:border-primary focus:ring-2 focus:ring-primary/20 
                            transition-all duration-200 resize-none"
                    />
                </div>
            )}
        </div>
    );
}
