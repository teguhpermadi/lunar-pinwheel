import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { cn } from '@/lib/utils';

interface CategorizationCorrectionProps {
    options: QuestionOption[];
    studentAnswer: any; // Record<string, string> (itemId -> categoryId)
    keyAnswer?: any;
}

export default function CategorizationCorrection({ options, studentAnswer = {} }: CategorizationCorrectionProps) {
    // Categories are typically options with metadata group_title
    const groupsMap = new Map<string, QuestionOption[]>();
    options.forEach(opt => {
        const title = opt.metadata?.group_title || opt.metadata?.category_title || 'Uncategorized';
        if (!groupsMap.has(title)) groupsMap.set(title, []);
        groupsMap.get(title)!.push(opt);
    });

    const groups = Array.from(groupsMap.entries()).map(([title, items]) => ({ title, items }));

    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categorization Analysis</h5>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {groups.map((group, idx) => (
                    <div key={idx} className="min-w-[250px] bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{group.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-500">
                                {group.items.length} Items
                            </span>
                        </div>

                        <div className="space-y-3">
                            {group.items.map((item) => {
                                const studentChoice = studentAnswer[item.id] || studentAnswer[item.option_key];
                                // We check if this item belongs to THIS category title
                                // In Categorization, often any item from the same group title is "correct" in that group
                                // But here we usually compare if student placed item A into category X
                                const isPlacedHere = studentChoice === group.title || studentChoice === item.metadata?.group_title;

                                return (
                                    <div key={item.id} className={cn(
                                        "p-3 rounded-2xl border transition-all shadow-sm",
                                        isPlacedHere
                                            ? "bg-white dark:bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/10"
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 grayscale-[0.5]"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="size-5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 flex items-center justify-center">
                                                {item.option_key}
                                            </span>
                                            {isPlacedHere && (
                                                <span className="material-symbols-outlined text-emerald-500 text-sm font-bold">check_circle</span>
                                            )}
                                        </div>
                                        <MathRenderer className="text-xs font-bold text-slate-700 dark:text-slate-300" content={item.content} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-slate-400 italic">Note: Highlighting items that student correctly placed in each category.</p>
        </div>
    );
}
