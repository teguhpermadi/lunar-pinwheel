import MathRenderer from '@/components/ui/MathRenderer';
import { QuestionOption } from '@/lib/api';

interface EssayCorrectionProps {
    studentAnswer: string;
    options?: QuestionOption[]; // Often used to store key/rubric
}

export default function EssayCorrection({ studentAnswer, options = [] }: EssayCorrectionProps) {
    const referenceAnswer = options.find(o => o.is_correct)?.content || options[0]?.content;

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Response</h5>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-h-[150px]">
                    <div className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {studentAnswer || <span className="italic text-slate-400">No answer provided.</span>}
                    </div>
                </div>
            </div>

            {referenceAnswer && (
                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">verified</span>
                        </div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Teacher's Reference / Key</h5>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <MathRenderer
                            className="text-slate-700 dark:text-slate-200 leading-relaxed"
                            content={referenceAnswer}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
