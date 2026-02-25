import { useEffect } from 'react';
import { Reorder } from 'framer-motion';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface MatchingPair {
    id?: string;
    uuid: string;
    rightUuid?: string;
    left: string;
    right: string;
    leftOptionId?: string;
    rightOptionId?: string;
}

interface MatchingInputProps {
    pairs: MatchingPair[];
    onChange: (pairs: MatchingPair[]) => void;
}

export default function MatchingInput({ pairs, onChange }: MatchingInputProps) {
    // Patch rightUuid if missing (backward compat)
    useEffect(() => {
        const needsPatch = pairs.some(p => !p.rightUuid);
        if (needsPatch) {
            onChange(pairs.map(p => ({
                ...p,
                rightUuid: p.rightUuid || crypto.randomUUID()
            })));
        }
    }, [pairs, onChange]);

    const handleAddPair = () => {
        onChange([...pairs, {
            uuid: crypto.randomUUID(),
            rightUuid: crypto.randomUUID(),
            left: '',
            right: ''
        }]);
    };

    const handleRemovePair = (index: number) => {
        if (pairs.length <= 2) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Minimum 2 pairs required',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }
        const newPairs = [...pairs];
        newPairs.splice(index, 1);
        onChange(newPairs);
    };

    const handleChange = (index: number, field: 'left' | 'right', value: string) => {
        const newPairs = [...pairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        onChange(newPairs);
    };

    // When reordering Left column, keep Right side fixed → changes pairings
    const handleReorderLeft = (newLeftOrder: MatchingPair[]) => {
        const currentRights = pairs.map(p => ({
            right: p.right,
            rightUuid: p.rightUuid,
            rightOptionId: p.rightOptionId
        }));

        const nextPairs = newLeftOrder.map((p, i) => ({
            ...p,
            right: currentRights[i].right,
            rightUuid: currentRights[i].rightUuid,
            rightOptionId: currentRights[i].rightOptionId
        }));

        onChange(nextPairs);
    };

    // When reordering Right column, keep Left side fixed → changes pairings
    const handleReorderRight = (newRightItems: any[]) => {
        const nextPairs = pairs.map((p, i) => ({
            ...p,
            right: newRightItems[i].content,
            rightUuid: newRightItems[i].rightUuid,
            rightOptionId: newRightItems[i].rightOptionId
        }));
        onChange(nextPairs);
    };

    const leftItems = pairs;

    const rightItems = pairs.map(p => ({
        rightUuid: p.rightUuid || 'temp-' + p.uuid,
        content: p.right,
        rightOptionId: p.rightOptionId
    }));

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Matching Builder</label>
                <button
                    onClick={handleAddPair}
                    className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Add Pair
                </button>
            </div>

            <div className="grid grid-cols-[1fr,40px,1fr] gap-4 items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                <div>Item (Question)</div>
                <div></div>
                <div>Match (Answer)</div>
            </div>

            <div className="relative grid grid-cols-[1fr,40px,1fr] gap-4">
                {/* Left Column - Drag to reorder questions */}
                <Reorder.Group axis="y" values={leftItems} onReorder={handleReorderLeft} className="space-y-4">
                    {leftItems.map((pair, index) => (
                        <Reorder.Item key={pair.uuid} value={pair} className="relative group">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-300 cursor-grab active:cursor-grabbing text-lg select-none">drag_indicator</span>
                                <div className="flex-1 min-w-0">
                                    <RichTextEditor
                                        value={pair.left}
                                        onChange={(val) => handleChange(index, 'left', val)}
                                        placeholder={`Item ${index + 1}`}
                                        minHeight="min-h-[64px]"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemovePair(index)}
                                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                {/* Center Link Icons */}
                <div className="flex flex-col items-center">
                    {pairs.map((_, i) => (
                        <div key={i} className="flex items-center justify-center" style={{ height: i === 0 ? '82px' : '98px' }}>
                            <span className="material-symbols-outlined text-slate-300">link</span>
                        </div>
                    ))}
                </div>

                {/* Right Column - Drag to reorder answers */}
                <Reorder.Group axis="y" values={rightItems} onReorder={handleReorderRight} className="space-y-4">
                    {rightItems.map((item, index) => (
                        <Reorder.Item key={item.rightUuid} value={item}>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-300 cursor-grab active:cursor-grabbing text-lg select-none">drag_indicator</span>
                                <div className="flex-1 min-w-0">
                                    <RichTextEditor
                                        value={item.content}
                                        onChange={(val) => handleChange(index, 'right', val)}
                                        placeholder={`Match for Item ${index + 1}`}
                                        minHeight="min-h-[64px]"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </section>
    );
}
