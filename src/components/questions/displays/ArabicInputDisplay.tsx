import { QuestionOption } from '@/lib/api';

interface ArabicInputDisplayProps {
    options?: QuestionOption[];
}

export default function ArabicInputDisplay({ options = [] }: ArabicInputDisplayProps) {
    if (!options || options.length === 0) return <div className="text-sm italic text-slate-400">No answer provided.</div>;

    const correctOption = options[0]; // For arabic_response, we expect one option with the correct text

    return (
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Correct Answer
            </h5>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
                <p
                    dir="rtl"
                    className="text-4xl text-slate-800 dark:text-slate-100 font-arabic font-medium leading-loose text-center"
                >
                    {correctOption.content}
                </p>
            </div>
        </div>
    );
}
