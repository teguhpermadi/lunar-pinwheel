import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface MultipleChoiceCorrectionProps {
    options: QuestionOption[];
    studentAnswer: any; // string (id) or string[] (ids)
    isMultiple?: boolean;
}

export default function MultipleChoiceCorrection({ options, studentAnswer, isMultiple = false }: MultipleChoiceCorrectionProps) {
    const isSelected = (optionId: string) => {
        if (isMultiple) {
            return Array.isArray(studentAnswer) && studentAnswer.includes(optionId);
        }
        return studentAnswer === optionId;
    };

    return (
        <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Options Analysis</h5>
            <div className="grid gap-3">
                {options.map((opt) => {
                    const selected = isSelected(opt.id);
                    const correct = opt.is_correct;

                    return (
                        <div
                            key={opt.id}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                correct
                                    ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5"
                                    : selected
                                        ? "border-rose-500/50 bg-rose-50/30 dark:bg-rose-500/5"
                                        : "border-slate-100 dark:border-slate-800 bg-white"
                            )}
                        >
                            <div className={cn(
                                "size-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                                correct
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : selected
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                            )}>
                                {opt.option_key}
                            </div>

                            <div className="flex-1">
                                <MathRenderer
                                    className={cn(
                                        "text-sm font-bold",
                                        correct ? "text-emerald-900 dark:text-emerald-400" : selected ? "text-rose-900 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                                    )}
                                    content={opt.content}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {selected && (
                                    <span className="px-2 py-1 rounded-md bg-white/50 text-[10px] font-black uppercase text-slate-500 shadow-sm border border-slate-200">
                                        Your Choice
                                    </span>
                                )}
                                {correct ? (
                                    <span className="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
                                ) : selected ? (
                                    <span className="material-symbols-outlined text-rose-500 text-xl font-bold">cancel</span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
