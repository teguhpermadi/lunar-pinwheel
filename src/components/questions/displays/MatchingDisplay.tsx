import { QuestionOption } from '@/lib/api';

interface MatchingDisplayProps {
    options?: QuestionOption[];
    matchingPairs?: any[]; // Allow for specialized MatchingPair structure if available
}

export default function MatchingDisplay({ options = [], matchingPairs }: MatchingDisplayProps) {
    // If we have explicit matchingPairs (from form state or processed data), use them
    let pairs = matchingPairs;

    // Otherwise, try to parse from options using metadata
    if (!pairs && options.length > 0) {
        const pairsMap = new Map<string, { left?: QuestionOption, right?: QuestionOption }>();

        options.forEach(opt => {
            const meta = opt.metadata;
            if (meta && meta.pair_id) {
                const pairId = String(meta.pair_id);
                if (!pairsMap.has(pairId)) {
                    pairsMap.set(pairId, {});
                }
                const pair = pairsMap.get(pairId)!;
                if (meta.side === 'left') {
                    pair.left = opt;
                } else if (meta.side === 'right') {
                    pair.right = opt;
                }
            }
        });

        // Convert map to array and sort by pair_id or just iteration order
        pairs = Array.from(pairsMap.values())
            .filter(p => p.left || p.right) // Show even if partial
            .map((p, index) => ({
                id: p.left?.id || p.right?.id || index,
                left: p.left?.content,
                right: p.right?.content,
            }));
    }

    if (!pairs || pairs.length === 0) {
        // Fallback for visual testing if no metadata but options exist (legacy/simple view)
        // But if user specifically asked for metadata support, this might not be needed.
        // Let's keep a simple fallback just in case:
        if (options && options.length > 0 && !options[0].metadata) {
            return (
                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Raw Options (No Pair Metadata)</div>
                    {options.map((opt) => (
                        <div key={opt.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                            {opt.content}
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="text-sm italic text-slate-400">No matching pairs defined.</div>;
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-[1fr,40px,1fr] gap-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                <div>Item</div>
                <div></div>
                <div>Match</div>
            </div>
            {pairs.map((pair, idx) => (
                <div key={pair.id || idx} className="grid grid-cols-[1fr,40px,1fr] gap-4 items-center">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                        <div dangerouslySetInnerHTML={{ __html: pair.left || '<span class="text-slate-300 italic">Empty</span>' }} />
                    </div>

                    <div className="flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300">link</span>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                        <div dangerouslySetInnerHTML={{ __html: pair.right || '<span class="text-slate-300 italic">Empty</span>' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
