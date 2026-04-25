import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface StudentMultipleSelectionInputProps {
    options: QuestionOption[];
    selectedAnswers: string[]; // comma separated or array? Backend expects string or array.
    onChange: (optionKeys: string[]) => void;
    showAnswer?: boolean;
}

export default function StudentMultipleSelectionInput({ options, selectedAnswers = [], onChange, showAnswer }: StudentMultipleSelectionInputProps) {
    const handleToggle = (key: string) => {
        if (selectedAnswers.includes(key)) {
            onChange(selectedAnswers.filter(k => k !== key));
        } else {
            onChange([...selectedAnswers, key]);
        }
    };

    return (
        <div className="flex flex-col space-y-3">
            {options.map((option) => (
                <label
                    key={option.id}
                    className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${showAnswer && option.is_correct
                        ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30'
                        : selectedAnswers.includes(option.option_key)
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                >
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                            checked={selectedAnswers.includes(option.option_key)}
                            onChange={() => handleToggle(option.option_key)}
                        />
                    </div>

                    <div className="ml-4 flex items-center gap-3 flex-1">

                        {option.media?.option_media?.[0] && (
                            <div className="size-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0">
                                <img src={option.media.option_media[0].url} alt="Option" className="size-full object-cover" />
                            </div>
                        )}

                        <MathRenderer
                            className={`text-lg transition-colors ${showAnswer && option.is_correct ? 'text-green-700 dark:text-green-300 font-semibold' : selectedAnswers.includes(option.option_key) ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}
                            content={option.content}
                        />
                    </div>
                </label>
            ))}
        </div>
    );
}
