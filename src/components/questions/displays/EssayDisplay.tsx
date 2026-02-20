import { QuestionOption } from '@/lib/api';

interface EssayDisplayProps {
    options?: QuestionOption[];
    keywords?: string;
}

export default function EssayDisplay({ options = [], keywords }: EssayDisplayProps) {
    // Try to find rubric in options if keywords prop is missing
    const rubric = keywords || options.find(o => o.option_key === 'ESSAY')?.content;

    return (
        <div className="space-y-6">
            {/* Mock Response Area */}
            {/* <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Student Response Area</h5>
                <div className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-sm italic">
                    Students will type their answer here...
                </div>
            </div> */}

            {/* Rubric Section */}
            {rubric ? (
                <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Grading Keywords / Rubric
                    </h5>
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rubric}
                    </div>
                </div>
            ) : (
                <div className="text-sm italic text-slate-400">No grading keywords or rubric set.</div>
            )}
        </div>
    );
}
