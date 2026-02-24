import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface MultipleSelectionCorrectionProps {
    options: QuestionOption[];
    studentAnswer: any; // string[] (ids/keys)
    keyAnswer?: any;    // { answers: string[] }
}

export default function MultipleSelectionCorrection({ options, studentAnswer, keyAnswer }: MultipleSelectionCorrectionProps) {
    const isSelected = (opt: QuestionOption) => {
        if (!studentAnswer || !Array.isArray(studentAnswer)) return false;

        const optionId = String(opt.id);
        const optionKey = String(opt.option_key).toUpperCase();

        const normalize = (val: any): string => {
            if (typeof val === 'object' && val !== null) {
                return String(val.id || val.option_id || val.option_key || val).toUpperCase();
            }
            return String(val).toUpperCase();
        };

        return studentAnswer.some(val => {
            const normalizedVal = normalize(val);
            return normalizedVal === optionId.toUpperCase() || normalizedVal === optionKey;
        });
    };

    const isCorrect = (opt: QuestionOption) => {
        const optionId = String(opt.id);
        const optionKey = String(opt.option_key).toUpperCase();

        if (keyAnswer) {
            const extractValues = (val: any): string[] => {
                const normalizeVal = (v: any) => String(v).toUpperCase();
                if (typeof val === 'object' && val !== null) {
                    const inner = val.answers || val.answer || val.id || val.option_id || val.option_key || val;
                    if (Array.isArray(inner)) return inner.map(normalizeVal);
                    return [normalizeVal(inner)];
                }
                if (Array.isArray(val)) return val.map(normalizeVal);
                return [normalizeVal(val)];
            };

            const targetValues = extractValues(keyAnswer);
            if (targetValues.includes(optionId.toUpperCase()) || targetValues.includes(optionKey)) {
                return true;
            }
        }

        const o = opt as any;
        return !!opt.is_correct || !!o.is_answer || opt.metadata?.is_correct || opt.metadata?.is_answer;
    };

    const correctOptions = options.filter(isCorrect);

    return (
        <div className="space-y-6">
            {correctOptions.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="material-symbols-outlined text-sm">verified</span>
                        </div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correct Answer Key</h5>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <div className="flex flex-wrap gap-2 items-center">
                            {correctOptions.map((opt) => (
                                <div key={opt.id} className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex-1 min-w-[200px]">
                                    <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                        {opt.option_key}
                                    </div>
                                    <div className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                        <MathRenderer content={opt.content} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Options Analysis</h5>
                <div className="grid gap-3">
                    {options.map((opt) => {
                        const selected = isSelected(opt);
                        const correct = isCorrect(opt);

                        return (
                            <div
                                key={opt.id}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                    correct
                                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                                        : selected
                                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10"
                                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                                )}
                            >
                                <div className={cn(
                                    "size-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                                    correct
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : selected
                                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                                )}>
                                    {opt.option_key}
                                </div>

                                <div className="flex-1">
                                    <MathRenderer
                                        className={cn(
                                            "text-sm font-bold",
                                            correct
                                                ? "text-emerald-900 dark:text-emerald-300"
                                                : selected
                                                    ? "text-rose-900 dark:text-rose-300"
                                                    : "text-slate-700 dark:text-slate-300"
                                        )}
                                        content={opt.content}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    {selected && (
                                        <span className={cn(
                                            "px-2 py-1 rounded-md text-[10px] font-black uppercase shadow-sm border",
                                            correct
                                                ? "bg-emerald-500 text-white border-emerald-400"
                                                : "bg-rose-500 text-white border-rose-400"
                                        )}>
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
        </div>
    );
}
