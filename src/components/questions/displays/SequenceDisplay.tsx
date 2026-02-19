import { QuestionOption } from '@/lib/api';

interface SequenceDisplayProps {
    options?: QuestionOption[];
    sequenceItems?: any[];
}

export default function SequenceDisplay({ options = [], sequenceItems }: SequenceDisplayProps) {
    const items = sequenceItems || options;

    // Ensure sorted by order
    const sortedItems = [...(items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!sortedItems || sortedItems.length === 0) return null;

    return (
        <div className="space-y-3 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 before:z-0">
            {sortedItems.map((item, idx) => (
                <div key={item.id || idx} className="relative z-10 flex items-center gap-4">
                    <div className="size-14 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Step</span>
                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{item.order || idx + 1}</span>
                    </div>

                    <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                        {item.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
