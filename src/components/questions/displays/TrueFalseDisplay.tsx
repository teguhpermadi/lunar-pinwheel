import { QuestionOption } from '@/lib/api';

interface TrueFalseDisplayProps {
    options?: QuestionOption[];
}

export default function TrueFalseDisplay({ options = [] }: TrueFalseDisplayProps) {
    if (!options || options.length === 0) return null;

    const correctOption = options.find(o => o.is_correct);

    if (!correctOption) return null;

    return (
        <div className="flex items-center gap-4">
            <div className={`
                px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2
                ${correctOption.option_key === 'A' || correctOption.content.toLowerCase() === 'true'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'}
            `}>
                <span className="material-symbols-outlined">check_circle</span>
                True
            </div>
            <div className={`
                px-6 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2
                ${correctOption.option_key === 'B' || correctOption.content.toLowerCase() === 'false'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'}
            `}>
                <span className="material-symbols-outlined">cancel</span>
                False
            </div>
        </div>
    );
}
