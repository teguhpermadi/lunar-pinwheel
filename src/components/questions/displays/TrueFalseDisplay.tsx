import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface TrueFalseDisplayProps {
    options?: QuestionOption[];
}

export default function TrueFalseDisplay({ options = [] }: TrueFalseDisplayProps) {
    if (!options || options.length === 0) return null;

    const icons = ['check_circle', 'cancel'];

    return (
        <div className="grid grid-cols-2 gap-4 w-full">
            {options.slice(0, 2).map((opt, index) => (
                <div
                    key={opt.id ?? index}
                    className={`
                        px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2
                        ${opt.is_correct
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'}
                    `}
                >
                    <span className="material-symbols-outlined">{icons[index] ?? icons[0]}</span>
                    <MathRenderer content={opt.content} />
                </div>
            ))}
        </div>
    );
}
