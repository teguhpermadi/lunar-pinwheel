import { useState, useEffect, useRef } from 'react';
import { Reorder } from 'framer-motion';
import { QuestionOption } from '@/lib/api';
import CollapsibleMathRenderer from '@/components/ui/CollapsibleMathRenderer';

interface StudentMatchingInputProps {
    options: QuestionOption[];
    selectedAnswer: Record<string, string> | null; // e.g. { "A": "key_1", "B": "key_2" }
    onChange: (value: Record<string, string>) => void;
}

export default function StudentMatchingInput({ options, selectedAnswer, onChange }: StudentMatchingInputProps) {
    const leftOptions = options.filter(o => o.metadata?.side === 'left');
    const initialRightOptions = options.filter(o => o.metadata?.side === 'right');

    const [orderedRight, setOrderedRight] = useState<QuestionOption[]>([]);
    const [draggedRightKey, setDraggedRightKey] = useState<string | null>(null);
    const hoveredRightRef = useRef<string | null>(null);
    // State to drive visual highlight during touch-drag
    const [hoveredRightKeyState, setHoveredRightKeyState] = useState<string | null>(null);

    // Refs for synchronization
    const leftInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rightInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const leftOuterRefs = useRef<(HTMLDivElement | null)[]>([]);
    const rightOuterRefs = useRef<(HTMLDivElement | null)[]>([]);
    const centerOuterRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const syncHeights = () => {
            leftOptions.forEach((_, i) => {
                const leftInner = leftInnerRefs.current[i];
                const rightInner = rightInnerRefs.current[i];
                const leftOuter = leftOuterRefs.current[i];
                const rightOuter = rightOuterRefs.current[i];
                const centerOuter = centerOuterRefs.current[i];

                if (leftOuter && rightOuter && leftInner && rightInner && centerOuter) {
                    // Reset heights
                    leftOuter.style.height = 'auto';
                    rightOuter.style.height = 'auto';
                    centerOuter.style.height = 'auto';

                    const maxConfig = window.innerWidth >= 768 ? 120 : 100;
                    // Add some padding to the inner height for the container, roughly 48px to account for p-4 (32px) + border + flexibility
                    const padding = window.innerWidth >= 768 ? 48 : 32;
                    const leftHeight = leftInner.scrollHeight + padding;
                    const rightHeight = rightInner.scrollHeight + padding;

                    const max = Math.max(leftHeight, rightHeight, maxConfig);

                    leftOuter.style.height = `${max}px`;
                    rightOuter.style.height = `${max}px`;
                    centerOuter.style.height = `${max}px`;
                }
            });
        };

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(syncHeights);
        });

        const timer = setTimeout(syncHeights, 100);
        const timer2 = setTimeout(syncHeights, 500); // Check again after MathJax renders
        const timer3 = setTimeout(syncHeights, 2000);

        // Important: we observe the inner content so it doesn't trigger a resize loop when outer height changes
        leftInnerRefs.current.forEach(el => el && observer.observe(el));
        rightInnerRefs.current.forEach(el => el && observer.observe(el));

        return () => {
            observer.disconnect();
            clearTimeout(timer);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [orderedRight, leftOptions]);

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

    // Touch fallback for mobile: detect target item under touch and perform reorder on touchend
    useEffect(() => {
        if (!draggedRightKey) return;

        const onTouchMove = (e: TouchEvent) => {
            if (!e.touches || e.touches.length === 0) return;
            const t = e.touches[0];
            const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
            let found: string | null = null;
            let cur = el;
            while (cur) {
                const attr = cur.getAttribute && cur.getAttribute('data-right-key');
                if (attr) {
                    found = attr;
                    break;
                }
                cur = cur.parentElement;
            }
            hoveredRightRef.current = found;
            setHoveredRightKeyState(found);
            // prevent page scroll while dragging
            e.preventDefault();
        };

        const onTouchEnd = () => {
            const targetKey = hoveredRightRef.current;
            if (targetKey && targetKey !== draggedRightKey) {
                const fromIndex = orderedRight.findIndex(r => r.option_key === draggedRightKey);
                const toIndex = orderedRight.findIndex(r => r.option_key === targetKey);
                if (fromIndex >= 0 && toIndex >= 0) {
                    const newOrder = [...orderedRight];
                    const [item] = newOrder.splice(fromIndex, 1);
                    newOrder.splice(toIndex, 0, item);
                    handleReorder(newOrder);
                }
            }

            hoveredRightRef.current = null;
            setHoveredRightKeyState(null);
            setDraggedRightKey(null);
            window.removeEventListener('touchmove', onTouchMove as EventListener);
            window.removeEventListener('touchend', onTouchEnd as EventListener);
        };

        window.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
        window.addEventListener('touchend', onTouchEnd as EventListener);

        return () => {
            window.removeEventListener('touchmove', onTouchMove as EventListener);
            window.removeEventListener('touchend', onTouchEnd as EventListener);
            hoveredRightRef.current = null;
        };
    }, [draggedRightKey, orderedRight]);

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
                    {leftOptions.map((left, index) => (
                        <div
                            ref={(el) => { leftOuterRefs.current[index] = el; }}
                            key={left.id}
                            className="min-h-[100px] md:min-h-[120px] p-3 sm:p-4 md:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 sm:gap-4 transition-all"
                        >
                            <div
                                className="flex-1 flex items-center"
                                ref={(el) => { leftInnerRefs.current[index] = el; }}
                            >
                                <CollapsibleMathRenderer
                                    content={left.content}
                                    className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 leading-tight break-words w-full"
                                    maxLines={3}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center justify-around py-4">
                    {leftOptions.map((_, index) => (
                        <div
                            ref={(el) => { centerOuterRefs.current[index] = el; }}
                            key={index}
                            className="flex items-center justify-center text-slate-200 dark:text-slate-800 min-h-[100px] md:min-h-[120px] pb-2 sm:pb-4"
                        >
                            <span className="material-symbols-outlined text-lg sm:text-2xl">link</span>
                        </div>
                    ))}
                </div>

                {/* Right Column - Reorderable */}
                <Reorder.Group axis="y" values={orderedRight} onReorder={handleReorder} className="space-y-2 sm:space-y-4">
                    {orderedRight.map((right, index) => (
                        <Reorder.Item
                            key={right.id}
                            value={right}
                            data-right-key={right.option_key}
                            onTouchStart={() => setDraggedRightKey(right.option_key)}
                            className="cursor-grab active:cursor-grabbing"
                        >
                            <div
                                ref={(el) => { rightOuterRefs.current[index] = el; }}
                                className={`min-h-[100px] md:min-h-[120px] p-2 sm:p-4 md:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/10 shadow-sm flex items-center gap-1 sm:gap-4 group hover:border-emerald-500/30 transition-all ${hoveredRightKeyState === right.option_key ? 'ring-2 ring-emerald-300 bg-emerald-50 border-emerald-300' : ''}`}
                            >
                                <span className="material-symbols-outlined text-slate-200 group-hover:text-emerald-500 transition-colors select-none text-lg sm:text-2xl">
                                    drag_indicator
                                </span>
                                <div
                                    className="flex-1 text-center flex items-center justify-center"
                                    ref={(el) => { rightInnerRefs.current[index] = el; }}
                                >
                                    <CollapsibleMathRenderer
                                        content={right.content}
                                        className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 leading-tight break-words"
                                        maxLines={3}
                                    />
                                </div>
                                <div className="flex flex-col gap-1 ml-1 sm:ml-2">
                                    <button
                                        type="button"
                                        disabled={orderedRight.indexOf(right) === 0}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const idx = orderedRight.indexOf(right);
                                            if (idx > 0) {
                                                const newOrder = [...orderedRight];
                                                [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                                                handleReorder(newOrder);
                                            }
                                        }}
                                        className="p-1 lg:p-1.5 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm sm:text-base">keyboard_arrow_up</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={orderedRight.indexOf(right) === orderedRight.length - 1}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const idx = orderedRight.indexOf(right);
                                            if (idx < orderedRight.length - 1) {
                                                const newOrder = [...orderedRight];
                                                [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
                                                handleReorder(newOrder);
                                            }
                                        }}
                                        className="p-1 lg:p-1.5 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm sm:text-base">keyboard_arrow_down</span>
                                    </button>
                                </div>
                            </div>

                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </div>
    );
}
