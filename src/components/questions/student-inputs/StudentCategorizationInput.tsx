import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';

interface StudentCategorizationInputProps {
    options: QuestionOption[];
    selectedAnswer: Record<string, string> | null; // { item_option_key: group_uuid }
    onChange: (value: Record<string, string>) => void;
}

export default function StudentCategorizationInput({ options, selectedAnswer, onChange }: StudentCategorizationInputProps) {
    // Determine unique categories from options metadata
    const categories = useMemo(() => {
        const uniqueGroups = new Map<string, string>();
        options.forEach(opt => {
            // Support both new and old metadata keys
            const groupUuid = opt.metadata?.group_uuid || opt.metadata?.group_index?.toString();
            const groupTitle = opt.metadata?.group_title || opt.metadata?.category_title;

            if (groupUuid && groupTitle && !uniqueGroups.has(groupUuid)) {
                uniqueGroups.set(groupUuid, groupTitle);
            }
        });
        return Array.from(uniqueGroups.entries()).map(([uuid, title]) => ({ uuid, title }));
    }, [options]);

    const [draggedItemKey, setDraggedItemKey] = useState<string | null>(null);
    // For touch fallback: track hovered group during touchmove
    const hoveredGroupRef = useRef<string | null>(null);
    // State to trigger re-render and show visual highlight during touch-drag
    const [hoveredGroupUuidState, setHoveredGroupUuidState] = useState<string | null>(null);

    // Initial state: separate items based on current selection
    // If an item's key is in selectedAnswer, it's in a category. Otherwise, it's ungrouped.
    const itemsByGroup = useMemo(() => {
        const groups: Record<string, QuestionOption[]> = {};
        const ungrouped: QuestionOption[] = [];

        // Initialize maps for all categories
        categories.forEach(cat => {
            groups[cat.uuid] = [];
        });

        options.forEach(opt => {
            const assignedGroupUuid = selectedAnswer?.[opt.option_key];
            if (assignedGroupUuid && groups[assignedGroupUuid]) {
                groups[assignedGroupUuid].push(opt);
            } else {
                ungrouped.push(opt);
            }
        });

        return { groups, ungrouped };
    }, [options, selectedAnswer, categories]);

    const handleDrop = (targetGroupUuid: string | null) => {
        if (!draggedItemKey) return;

        const newSelection = { ...(selectedAnswer || {}) };

        if (targetGroupUuid) {
            newSelection[draggedItemKey] = targetGroupUuid;
        } else {
            delete newSelection[draggedItemKey];
        }

        onChange(newSelection);
        setDraggedItemKey(null);
    };

    const groupSequence = useMemo(() => {
        return [...categories.map(c => c.uuid), null];
    }, [categories]);

    const handleMoveItem = (itemKey: string, currentGroup: string | null, direction: 1 | -1) => {
        const currentIndex = groupSequence.indexOf(currentGroup);
        if (currentIndex === -1) return;
        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < groupSequence.length) {
            const nextGroup = groupSequence[nextIndex];
            const newSelection = { ...(selectedAnswer || {}) };
            if (nextGroup) {
                newSelection[itemKey] = nextGroup;
            } else {
                delete newSelection[itemKey];
            }
            onChange(newSelection);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Touch fallback: when an item is being 'dragged' via touch, listen for touchmove
    // to detect the underlying drop target and on touchend perform the drop.
    useEffect(() => {
        if (!draggedItemKey) return;

        const onTouchMove = (e: TouchEvent) => {
            if (!e.touches || e.touches.length === 0) return;
            const t = e.touches[0];
            // elementFromPoint expects client coordinates
            const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
            let found: string | null = null;
            let cur = el;
            while (cur) {
                // our drop containers will have data-group-uuid attributes
                const attr = cur.getAttribute && cur.getAttribute('data-group-uuid');
                if (attr !== null) {
                    found = attr === '__ungrouped__' ? '__ungrouped__' : attr;
                    break;
                }
                cur = cur.parentElement;
            }
            hoveredGroupRef.current = found;
            setHoveredGroupUuidState(found);
            // prevent scrolling while dragging
            e.preventDefault();
        };

        const onTouchEnd = () => {
            const target = hoveredGroupRef.current;
            if (target === '__ungrouped__') {
                handleDrop(null);
            } else {
                handleDrop(target);
            }
            hoveredGroupRef.current = null;
            setHoveredGroupUuidState(null);
            // cleanup
            window.removeEventListener('touchmove', onTouchMove as EventListener);
            window.removeEventListener('touchend', onTouchEnd as EventListener);
        };

        window.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
        window.addEventListener('touchend', onTouchEnd as EventListener);

        return () => {
            window.removeEventListener('touchmove', onTouchMove as EventListener);
            window.removeEventListener('touchend', onTouchEnd as EventListener);
            hoveredGroupRef.current = null;
        };
    }, [draggedItemKey]);

    return (
        <div className="space-y-8">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex gap-3">
                <span className="material-symbols-outlined text-blue-500">info</span>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Geser (drag) kartu jawaban di bawah ke dalam kotak kategori yang sesuai.
                </p>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div
                        key={category.uuid}
                        data-group-uuid={category.uuid}
                        onDragOver={onDragOver}
                        onDrop={() => handleDrop(category.uuid)}
                        className={`min-h-[200px] bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed transition-all ${draggedItemKey ? 'border-primary/40 bg-primary/5' : 'border-slate-200 dark:border-slate-800'} ${hoveredGroupUuidState === category.uuid ? 'ring-2 ring-emerald-300 bg-emerald-50 border-emerald-300' : ''}`}
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-t-2xl font-bold text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">category</span>
                            {category.title}
                            <span className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {itemsByGroup.groups[category.uuid].length}
                            </span>
                        </div>

                        <div className="p-4 space-y-3">
                            {itemsByGroup.groups[category.uuid].map((item) => (
                                <ItemCard
                                    key={item.option_key}
                                    item={item}
                                    onDragStart={() => setDraggedItemKey(item.option_key)}
                                    onTouchStart={() => setDraggedItemKey(item.option_key)}
                                    onMovePrev={() => handleMoveItem(item.option_key, category.uuid, -1)}
                                    onMoveNext={() => handleMoveItem(item.option_key, category.uuid, 1)}
                                    disablePrev={groupSequence.indexOf(category.uuid) === 0}
                                    disableNext={groupSequence.indexOf(category.uuid) === groupSequence.length - 1}
                                />
                            ))}
                            {itemsByGroup.groups[category.uuid].length === 0 && (
                                <div className="py-8 text-center text-xs text-slate-400 italic">
                                    Drop items here
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ungrouped Area - Fixed at Bottom */}
            <div className="mt-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Kartu Jawaban</h3>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <div
                    data-group-uuid="__ungrouped__"
                    onDragOver={onDragOver}
                    onDrop={() => handleDrop(null)}
                    className={`min-h-[150px] p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed transition-all ${draggedItemKey ? 'border-primary/40' : 'border-slate-200 dark:border-slate-800'
                        }`}
                >
                    <div className="flex flex-wrap gap-4 justify-center">
                        <AnimatePresence>
                            {itemsByGroup.ungrouped.map((item) => (
                                <ItemCard
                                    key={item.option_key}
                                    item={item}
                                    onDragStart={() => setDraggedItemKey(item.option_key)}
                                    onTouchStart={() => setDraggedItemKey(item.option_key)}
                                    onMovePrev={() => handleMoveItem(item.option_key, null, -1)}
                                    onMoveNext={() => handleMoveItem(item.option_key, null, 1)}
                                    disablePrev={groupSequence.indexOf(null) === 0}
                                    disableNext={groupSequence.indexOf(null) === groupSequence.length - 1}
                                />
                            ))}
                        </AnimatePresence>
                        {itemsByGroup.ungrouped.length === 0 && (
                            <div className="text-sm text-slate-400 flex flex-col items-center gap-2 py-4">
                                <span className="material-symbols-outlined text-3xl opacity-20">inventory_2</span>
                                <span>Semua jawaban telah dikelompokkan</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ItemCard({
    item,
    onDragStart,
    onTouchStart,
    onMovePrev,
    onMoveNext,
    disablePrev,
    disableNext
}: {
    item: QuestionOption;
    onDragStart: () => void;
    onTouchStart?: () => void;
    onMovePrev?: () => void;
    onMoveNext?: () => void;
    disablePrev?: boolean;
    disableNext?: boolean;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            draggable
            onDragStart={onDragStart}
            onTouchStart={() => {
                // start touch-drag using provided handler (sets draggedItemKey)
                if (onTouchStart) onTouchStart();
            }}
            className="w-[200px] relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all shrink-0 group flex flex-col"
        >
            <div className="flex justify-between items-center mb-2 gap-2">
                <button
                    type="button"
                    disabled={disablePrev}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMovePrev?.(); }}
                    className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-400 hover:text-primary flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
                <button
                    type="button"
                    disabled={disableNext}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveNext?.(); }}
                    className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-400 hover:text-primary flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>
            </div>

            {item.media?.option_media?.[0]?.url && (
                <div className="mb-2 aspect-video rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 cursor-zoom-in">
                    <img
                        src={item.media.option_media[0].url}
                        className="w-full h-full object-cover"
                        alt="Item"
                        draggable={false}
                    />
                </div>
            )}
            <MathRenderer
                content={item.content}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-3 text-center"
            />
        </motion.div>
    );
}
