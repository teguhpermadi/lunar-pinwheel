import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface TrueFalseCorrectionProps {
    options: QuestionOption[];
    studentAnswer: any; // string (id/key)
    keyAnswer?: any;    // { answer: string }
}

export default function TrueFalseCorrection({ options, studentAnswer, keyAnswer }: TrueFalseCorrectionProps) {
    const isSelected = (opt: QuestionOption) => {
        if (!studentAnswer) return false;

        const optionId = String(opt.id);
        const optionKey = String(opt.option_key).toUpperCase();

        const normalize = (val: any): string => {
            if (typeof val === 'object' && val !== null) {
                return String(val.id || val.option_id || val.option_key || val).toUpperCase();
            }
            return String(val).toUpperCase();
        };

        const normalizedStudentAnswer = normalize(studentAnswer);
        return normalizedStudentAnswer === optionId.toUpperCase() || normalizedStudentAnswer === optionKey;
    };

    const isCorrect = (opt: QuestionOption) => {
        const optionId = String(opt.id);
        const optionKey = String(opt.option_key).toUpperCase();

        if (keyAnswer) {
            const extractValues = (val: any): string[] => {
                const normalizeVal = (v: any) => String(v).toUpperCase();
                if (typeof val === 'object' && val !== null) {
                    const inner = val.answer || val.id || val.option_id || val.option_key || val;
                    if (Array.isArray(inner)) return inner.map(normalizeVal);
                    return [normalizeVal(inner)];
                }
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


    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Analysis</h5>
            <div className="grid grid-cols-2 gap-4">
                {options.map((opt) => {
                    const selected = isSelected(opt);
                    const correct = isCorrect(opt);

                    return (
                        <div
                            key={opt.id}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-4",
                                correct
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                                    : selected
                                        ? "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10"
                                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                            )}
                        >
                            <div className={cn(
                                "size-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0",
                                correct
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    : selected
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                            )}>
                                {opt.option_key}
                            </div>

                            <MathRenderer
                                className={cn(
                                    "text-base font-black uppercase tracking-widest",
                                    correct
                                        ? "text-emerald-900 dark:text-emerald-300"
                                        : selected
                                            ? "text-rose-900 dark:text-rose-300"
                                            : "text-slate-700 dark:text-slate-300"
                                )}
                                content={opt.content}
                            />

                            <div className="flex items-center gap-2">
                                {selected && (
                                    <span className={cn(
                                        "px-2 py-1 rounded-md text-[9px] font-black uppercase shadow-sm border",
                                        correct
                                            ? "bg-emerald-500 text-white border-emerald-400"
                                            : "bg-rose-500 text-white border-rose-400"
                                    )}>
                                        Your Choice
                                    </span>
                                )}
                                {correct ? (
                                    <span className="material-symbols-outlined text-emerald-500 text-2xl font-bold">check_circle</span>
                                ) : selected ? (
                                    <span className="material-symbols-outlined text-rose-500 text-2xl font-bold">cancel</span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
