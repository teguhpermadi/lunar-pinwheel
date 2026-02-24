import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface SequenceCorrectionProps {
    options: QuestionOption[];
    studentAnswer: string[]; // Array of option IDs in student's chosen order
}

export default function SequenceCorrection({ options, studentAnswer = [] }: SequenceCorrectionProps) {
    // Sort options by original order to get the correct sequence
    const correctSequence = [...options].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sequence Analysis</h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Student Sequence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-indigo-500 text-sm">person</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student's Order</span>
                    </div>
                    <div className="space-y-2">
                        {studentAnswer.length > 0 ? (
                            studentAnswer.map((id, index) => {
                                const option = options.find(o => o.id === id);
                                const isCorrectPos = correctSequence[index]?.id === id;

                                return (
                                    <div key={id || index} className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                        isCorrectPos
                                            ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5"
                                            : "border-rose-500/30 bg-rose-50/20 dark:bg-rose-500/5"
                                    )}>
                                        <div className={cn(
                                            "size-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                            isCorrectPos ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <MathRenderer className="text-sm font-bold" content={option?.content || 'Unknown Item'} />
                                        </div>
                                        <span className="material-symbols-outlined text-lg">
                                            {isCorrectPos ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm italic">
                                No items ordered.
                            </div>
                        )}
                    </div>
                </div>

                {/* Correct Sequence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correct Order</span>
                    </div>
                    <div className="space-y-2">
                        {correctSequence.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm opacity-80">
                                <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-black shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <MathRenderer className="text-sm font-bold text-slate-600 dark:text-slate-400" content={option.content} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
