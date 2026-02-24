import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface MatchingCorrectionProps {
    options: QuestionOption[];
    studentAnswer: any; // Record<string, string> (leftId -> rightId)
    keyAnswer?: any;
}

export default function MatchingCorrection({ options, studentAnswer = {}, keyAnswer }: MatchingCorrectionProps) {
    const leftOptions = options.filter(o => o.metadata?.side === 'left');
    const rightOptions = options.filter(o => o.metadata?.side === 'right');

    const getCorrectRightId = (left: QuestionOption) => {
        // 1. Try keyAnswer.pairs if available
        if (keyAnswer && keyAnswer.pairs) {
            const correctRightKey = keyAnswer.pairs[left.option_key];
            if (correctRightKey) {
                const found = rightOptions.find(o => o.option_key === correctRightKey);
                if (found) return found.id;
            }
        }

        // 2. Fallback to pair_id in metadata
        const pairId = left.metadata?.pair_id;
        return rightOptions.find(o => o.metadata?.pair_id === pairId)?.id;
    };

    return (
        <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Matching Pairs Analysis</h5>
            <div className="grid gap-3">
                {leftOptions.map((left) => {
                    // studentAnswer can be { [leftId]: rightId } or { [leftKey]: rightKey }
                    const studentChoice = studentAnswer[left.id] || studentAnswer[left.option_key];
                    const correctRightId = getCorrectRightId(left);

                    // Finder helper to handle both ID and Key in studentChoice
                    const findRightOption = (choice: any) => {
                        if (!choice) return null;
                        const val = String(choice);
                        return rightOptions.find(o => o.id === val || o.option_key === val);
                    };

                    const studentRight = findRightOption(studentChoice);
                    const correctRight = rightOptions.find(o => o.id === correctRightId);

                    const isCorrect = studentRight && correctRight && (studentRight.id === correctRight.id);

                    return (
                        <div key={left.id} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                            {/* Left Side */}
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                <span className="size-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                    {left.option_key}
                                </span>
                                <MathRenderer className="text-sm font-medium" content={left.content} />
                            </div>

                            {/* Connection Indicator */}
                            <div className="flex flex-col items-center gap-1">
                                <span className={cn(
                                    "material-symbols-outlined text-xl font-bold",
                                    isCorrect ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {isCorrect ? 'trending_flat' : 'sync_problem'}
                                </span>
                            </div>

                            {/* Right Side (Student Choice) */}
                            <div className={cn(
                                "p-3 rounded-xl border-2 shadow-sm flex items-center gap-2",
                                isCorrect
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                                    : "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10"
                            )}>
                                {studentRight ? (
                                    <>
                                        <span className={cn(
                                            "size-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm",
                                            isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {studentRight.option_key}
                                        </span>
                                        <MathRenderer
                                            className={cn(
                                                "text-sm font-medium",
                                                isCorrect ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-300"
                                            )}
                                            content={studentRight.content}
                                        />
                                    </>
                                ) : (
                                    <span className="text-xs italic text-slate-400 p-1">No selection</span>
                                )}
                            </div>

                            {!isCorrect && correctRight && (
                                <div className="col-start-3 mt-1 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 shrink-0">Correct Key:</span>
                                    <span className="size-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                        {correctRight.option_key}
                                    </span>
                                    <MathRenderer className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate" content={correctRight.content} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
