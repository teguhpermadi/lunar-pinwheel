import { useState, useEffect, useMemo } from 'react';
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

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

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
                        onDragOver={onDragOver}
                        onDrop={() => handleDrop(category.uuid)}
                        className={`min-h-[200px] bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed transition-all ${draggedItemKey ? 'border-primary/40 bg-primary/5' : 'border-slate-200 dark:border-slate-800'
                            }`}
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

function ItemCard({ item, onDragStart }: { item: QuestionOption; onDragStart: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            draggable
            onDragStart={onDragStart}
            className="w-[200px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all shrink-0"
        >
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
