import MathRenderer from '@/components/ui/MathRenderer';
import { QuestionOption } from '@/lib/api';

interface ShortAnswerCorrectionProps {
    studentAnswer: string;
    options?: QuestionOption[];
    keyAnswer?: any; // { answers: string[] }
}

export default function ShortAnswerCorrection({ studentAnswer, options = [], keyAnswer }: ShortAnswerCorrectionProps) {
    const extractValue = (val: any): string[] => {
        if (typeof val === 'object' && val !== null) {
            const inner = val.answers || val.answer || val.id || val.option_id || val.option_key || val;
            return Array.isArray(inner) ? inner.map(String) : [String(inner)];
        }
        return Array.isArray(val) ? val.map(String) : [String(val)];
    };

    let referenceAnswers = keyAnswer ? extractValue(keyAnswer) : [];

    if (referenceAnswers.length === 0) {
        referenceAnswers = options.filter(o => o.is_correct || (o as any).is_answer).map(o => o.content);
        if (referenceAnswers.length === 0 && options[0]) {
            referenceAnswers = [options[0].content];
        }
    }


    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Response</h5>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-slate-700 dark:text-slate-200 font-bold text-lg">
                        {studentAnswer || <span className="italic text-slate-400">No answer provided.</span>}
                    </div>
                </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correct Answer Key</h5>
                </div>
                <div className="grid gap-3">
                    {referenceAnswers.map((answer, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {i + 1}
                            </div>
                            <MathRenderer
                                className="text-slate-700 dark:text-slate-200 font-bold"
                                content={answer}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
