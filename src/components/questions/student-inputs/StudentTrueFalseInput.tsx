import { QuestionOption } from '@/lib/api';

interface StudentTrueFalseInputProps {
    options: QuestionOption[];
    selectedAnswer: string | null;
    onChange: (optionKey: string) => void;
}

export default function StudentTrueFalseInput({ options, selectedAnswer, onChange }: StudentTrueFalseInputProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onChange(option.option_key)}
                    className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${selectedAnswer === option.option_key
                            ? (option.content?.toLowerCase() === 'true' || option.content?.toLowerCase() === 'benar'
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                                : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600')
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary grayscale-[0.5] hover:grayscale-0'
                        }`}
                >
                    <span className="material-icons text-5xl mb-3">
                        {option.content?.toLowerCase() === 'true' || option.content?.toLowerCase() === 'benar' ? 'check_circle' : 'cancel'}
                    </span>
                    <span className="text-xl font-bold uppercase tracking-wider">{option.content}</span>
                </button>
            ))}
        </div>
    );
}
