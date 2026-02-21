import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface MathInputDisplayProps {
    options?: QuestionOption[];
}

export default function MathInputDisplay({ options = [] }: MathInputDisplayProps) {
    if (!options || options.length === 0) return <div className="text-sm italic text-slate-400">No answer provided.</div>;

    const correctOption = options[0]; // For math_input, we expect one option with the correct LaTeX

    return (
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Correct Answer
            </h5>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
                <MathRenderer
                    content={`$${correctOption.content}$`}
                    isHtml={false}
                    className="text-2xl text-slate-800 dark:text-slate-100 font-medium"
                />
            </div>
        </div>
    );
}
