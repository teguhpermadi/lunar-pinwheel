import MathRenderer from '@/components/ui/MathRenderer';
import { QuestionOption } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CategorizationResponseCorrectionProps {
    studentAnswer: any; // Record<string, string> (itemId -> categoryId/Title)
    options: QuestionOption[];
    keyAnswer?: any;
}

export default function CategorizationResponseCorrection({ studentAnswer, options = [] }: CategorizationResponseCorrectionProps) {
    const safeStudentAnswer = (studentAnswer && typeof studentAnswer === 'object') ? studentAnswer : {};

    // Categories are defined by metadata category_title or group_title
    const groupsMap = new Map<string, QuestionOption[]>();
    options.forEach(opt => {
        const categoryTitle = opt.metadata?.category_title || opt.metadata?.group_title || 'Uncategorized';
        if (!groupsMap.has(categoryTitle)) groupsMap.set(categoryTitle, []);
        groupsMap.get(categoryTitle)!.push(opt);
    });

    const groups = Array.from(groupsMap.entries()).map(([title, items]) => ({ title, items }));

    // Helper to get student's chosen category for an item
    const getStudentCategory = (itemId: string, optionKey: string) => {
        return safeStudentAnswer[itemId] || safeStudentAnswer[optionKey];
    };

    const renderBoard = (title: string, icon: string, bgColor: string, iconColor: string, isKey: boolean = false) => (
        <div className={cn("rounded-3xl p-6 border transition-all", bgColor)}>
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("size-8 rounded-xl flex items-center justify-center text-white shadow-sm", iconColor)}>
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {title}
                </h5>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {groups.map((group, gIdx) => (
                    <div key={gIdx} className="min-w-[280px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{group.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">
                                {isKey ? group.items.length : group.items.filter(item => getStudentCategory(item.id, item.option_key) === group.title).length} Items
                            </span>
                        </div>

                        <div className="space-y-2 min-h-[50px]">
                            {isKey ? (
                                group.items.map((item) => (
                                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <span className="size-5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                                            {item.option_key}
                                        </span>
                                        <MathRenderer className="text-xs font-bold text-slate-600 dark:text-slate-400" content={item.content} />
                                    </div>
                                ))
                            ) : (
                                // Student board: Show items placed by student in this category
                                options.filter(item => getStudentCategory(item.id, item.option_key) === group.title).map((item) => {
                                    const isCorrect = (item.metadata?.category_title || item.metadata?.group_title) === group.title;

                                    return (
                                        <div key={item.id} className={cn(
                                            "p-3 rounded-xl border flex items-center gap-3 transition-all",
                                            isCorrect
                                                ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"
                                                : "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20"
                                        )}>
                                            <span className={cn(
                                                "size-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 text-white",
                                                isCorrect ? "bg-emerald-500" : "bg-rose-500"
                                            )}>
                                                {item.option_key}
                                            </span>
                                            <div className="flex-1">
                                                <MathRenderer
                                                    className={cn(
                                                        "text-xs font-bold",
                                                        isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                                    )}
                                                    content={item.content}
                                                />
                                            </div>
                                            <span className={cn(
                                                "material-symbols-outlined text-sm font-bold",
                                                isCorrect ? "text-emerald-500" : "text-rose-500"
                                            )}>
                                                {isCorrect ? 'check' : 'close'}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            {!isKey && options.filter(item => getStudentCategory(item.id, item.option_key) === group.title).length === 0 && (
                                <div className="h-full flex items-center justify-center py-4 opacity-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Empty</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Student Response Board */}
            {renderBoard(
                "Student Response",
                "person",
                "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800",
                "bg-indigo-500",
                false
            )}

            {/* Correct Key Reference Board */}
            {renderBoard(
                "Correct Categorization Key",
                "verified",
                "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100/50 dark:border-emerald-500/10",
                "bg-emerald-500",
                true
            )}
        </div>
    );
}
