import { QuestionOption } from '@/lib/api';

interface MultipleChoiceDisplayProps {
    options?: QuestionOption[];
    type: 'multiple_choice' | 'multiple_selection';
    onMediaClick?: (url: string) => void;
}

export default function MultipleChoiceDisplay({ options = [], onMediaClick }: MultipleChoiceDisplayProps) {
    if (!options || options.length === 0) return null;

    return (
        <div className="space-y-3">
            {options.map((opt) => (
                <div
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border ${opt.is_correct ? 'border-emerald-500/50' : 'border-slate-200 dark:border-slate-700'}`}
                >
                    <span className={`size-6 rounded-full border-2 ${opt.is_correct ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 dark:border-slate-600 text-slate-400'} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                        {opt.option_key}
                    </span>

                    {opt.media?.option_media?.[0] && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                const url = opt.media?.option_media?.[0]?.url;
                                if (url) onMediaClick?.(url);
                            }}
                            className="size-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in group-hover:border-primary/50 transition-colors"
                        >
                            <img
                                src={opt.media.option_media[0].url}
                                alt="Option"
                                className="size-full object-cover"
                            />
                        </div>
                    )}

                    <div className="text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: opt.content }} />
                    {opt.is_correct && <span className="ml-auto material-symbols-outlined text-emerald-500 text-lg">check_circle</span>}
                </div>
            ))}
        </div>
    );
}
