import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface StudentMatchingInputProps {
    options: QuestionOption[];
    selectedAnswer: Record<string, string> | null; // e.g. { "A": "key_1", "B": "key_2" }
    onChange: (value: Record<string, string>) => void;
}

export default function StudentMatchingInput({ options, selectedAnswer, onChange }: StudentMatchingInputProps) {
    const leftOptions = options.filter(o => o.metadata?.side === 'left');
    const initialRightOptions = options.filter(o => o.metadata?.side === 'right');

    const [orderedRight, setOrderedRight] = useState<QuestionOption[]>([]);

    useEffect(() => {
        if (selectedAnswer && Object.keys(selectedAnswer).length > 0) {
            // Reconstruct order from selectedAnswer
            const newOrder = leftOptions.map(left => {
                const rightKey = selectedAnswer[left.option_key];
                return initialRightOptions.find(r => r.option_key === rightKey) || initialRightOptions[0];
            }).filter(Boolean);

            // Add any missing right options (though in matching they should all be there)
            const missing = initialRightOptions.filter(r => !newOrder.find(no => no.id === r.id));
            setOrderedRight([...newOrder, ...missing]);
        } else {
            // Randomize or just show default order
            setOrderedRight(initialRightOptions);
        }
    }, [selectedAnswer, options]);

    const handleReorder = (newOrder: QuestionOption[]) => {
        setOrderedRight(newOrder);

        // Generate the matching record: { left_key: right_key }
        const newSelection: Record<string, string> = {};
        leftOptions.forEach((left, index) => {
            if (newOrder[index]) {
                newSelection[left.option_key] = newOrder[index].option_key;
            }
        });
        onChange(newSelection);
    };

    return (
        <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3">
                <span className="material-icons text-blue-500">touch_app</span>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Susunlah jawaban di kolom kanan dengan cara <strong>menarik (drag)</strong> ikon indikator agar sesuai dengan pernyataan di kolom kiri.
                </p>
            </div>

            <div className="grid grid-cols-[1fr,20px,1fr] sm:grid-cols-[1fr,40px,1fr] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                <div className="text-center">Pernyataan</div>
                <div />
                <div className="text-center">Jawaban</div>
            </div>

            <div className="relative grid grid-cols-[1fr,20px,1fr] sm:grid-cols-[1fr,40px,1fr] gap-2 sm:gap-4">
                {/* Left Column - Fixed */}
                <div className="space-y-2 sm:space-y-4">
                    {leftOptions.map((left) => (
                        <div
                            key={left.id}
                            className="h-[100px] md:h-[120px] p-3 sm:p-4 md:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 sm:gap-4 transition-all"
                        >
                            <div className="flex-1 overflow-auto max-h-full scrollbar-hide flex items-center">
                                <MathRenderer
                                    content={left.content}
                                    className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 leading-tight break-words w-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center link icons */}
                <div className="flex flex-col items-center justify-around py-4">
                    {leftOptions.map((_, i) => (
                        <div key={i} className="flex items-center justify-center text-slate-200 dark:text-slate-800 h-[100px] md:h-[120px] pb-2 sm:pb-4">
                            <span className="material-symbols-outlined text-lg sm:text-2xl">link</span>
                        </div>
                    ))}
                </div>

                {/* Right Column - Reorderable */}
                <Reorder.Group axis="y" values={orderedRight} onReorder={handleReorder} className="space-y-2 sm:space-y-4">
                    {orderedRight.map((right) => (
                        <Reorder.Item
                            key={right.id}
                            value={right}
                            className="cursor-grab active:cursor-grabbing"
                        >
                            <div className="h-[100px] md:h-[120px] p-2 sm:p-4 md:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/10 shadow-sm flex items-center gap-1 sm:gap-4 group hover:border-emerald-500/30 transition-all">
                                <span className="material-symbols-outlined text-slate-200 group-hover:text-emerald-500 transition-colors select-none text-lg sm:text-2xl">
                                    drag_indicator
                                </span>
                                <div className="flex-1 overflow-auto max-h-full scrollbar-hide text-center flex items-center justify-center">
                                    <MathRenderer
                                        content={right.content}
                                        className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 leading-tight break-words"
                                    />
                                </div>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </div>
    );
}
