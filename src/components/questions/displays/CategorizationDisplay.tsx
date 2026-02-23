import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface CategorizationDisplayProps {
    options?: QuestionOption[];
    onMediaClick?: (url: string) => void;
}

export default function CategorizationDisplay({ options = [], onMediaClick }: CategorizationDisplayProps) {
    if (!options || options.length === 0) {
        return <div className="text-sm italic text-slate-400">No categorized items defined.</div>;
    }

    // Group options by category title from metadata
    const groupsMap = new Map<string, QuestionOption[]>();

    options.forEach(opt => {
        const categoryTitle = opt.metadata?.group_title || opt.metadata?.category_title || 'Uncategorized';
        if (!groupsMap.has(categoryTitle)) {
            groupsMap.set(categoryTitle, []);
        }
        groupsMap.get(categoryTitle)!.push(opt);
    });

    const groups = Array.from(groupsMap.entries()).map(([title, items]) => ({
        title,
        items
    }));

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {groups.map((group, gIdx) => (
                <div
                    key={gIdx}
                    className="min-w-[200px] max-w-[250px] bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-3"
                >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        {group.title}
                    </div>

                    <div className="space-y-2">
                        {group.items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                {item.media?.option_media?.[0]?.url && (
                                    <div
                                        onClick={() => onMediaClick?.(item.media!.option_media![0].url)}
                                        className="mb-2 aspect-video rounded-md overflow-hidden border border-slate-100 dark:border-slate-800 cursor-zoom-in hover:border-primary/50 transition-colors"
                                    >
                                        <img
                                            src={item.media.option_media[0].url}
                                            className="w-full h-full object-cover"
                                            alt="Item"
                                        />
                                    </div>
                                )}
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                    <MathRenderer content={item.content} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
