import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/ui/RichTextEditor';

export interface CategorizationItem {
    uuid: string;
    id?: string;
    content: string;
    media?: { url: string; id: string } | null;
    pendingImage?: File | null;
    previewUrl?: string | null;
}

export interface CategorizationGroup {
    uuid: string;
    title: string;
    items: CategorizationItem[];
}

interface CategorizationInputProps {
    groups: CategorizationGroup[];
    onChange: (groups: CategorizationGroup[]) => void;
    onDeleteMedia?: (itemUuid: string, mediaId?: string) => void;
}

export default function CategorizationInput({ groups, onChange, onDeleteMedia }: CategorizationInputProps) {
    const [draggedItem, setDraggedItem] = useState<{ groupIndex: number; itemIndex: number } | null>(null);

    const handleAddGroup = () => {
        onChange([...groups, {
            uuid: crypto.randomUUID(),
            title: `Category ${groups.length + 1}`,
            items: []
        }]);
    };

    const handleRemoveGroup = (groupIndex: number) => {
        if (groups.length <= 1) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Minimum 1 category required',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        Swal.fire({
            title: 'Delete Category?',
            text: "This will also delete all items in this category.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const newGroups = [...groups];
                newGroups.splice(groupIndex, 1);
                onChange(newGroups);
            }
        });
    };

    const handleUpdateGroupTitle = (groupIndex: number, title: string) => {
        const newGroups = [...groups];
        newGroups[groupIndex] = { ...newGroups[groupIndex], title };
        onChange(newGroups);
    };

    const handleAddItem = (groupIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items.push({
            uuid: crypto.randomUUID(),
            content: ''
        });
        onChange(newGroups);
    };

    const handleRemoveItem = (groupIndex: number, itemIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items.splice(itemIndex, 1);
        onChange(newGroups);
    };

    const handleUpdateItemContent = (groupIndex: number, itemIndex: number, content: string) => {
        const newGroups = [...groups];
        newGroups[groupIndex].items[itemIndex] = { ...newGroups[groupIndex].items[itemIndex], content };
        onChange(newGroups);
    };

    const handleItemImageUpload = (groupIndex: number, itemIndex: number, file: File) => {
        const newGroups = [...groups];
        const item = newGroups[groupIndex].items[itemIndex];

        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);

        item.pendingImage = file;
        item.previewUrl = URL.createObjectURL(file);
        onChange(newGroups);
    };

    const handleItemImageDelete = (groupIndex: number, itemIndex: number) => {
        const newGroups = [...groups];
        const item = newGroups[groupIndex].items[itemIndex];

        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);

        const mediaId = item.media?.id;
        item.pendingImage = null;
        item.previewUrl = null;
        item.media = null;

        if (onDeleteMedia) {
            onDeleteMedia(item.uuid, mediaId);
        }

        onChange(newGroups);
    };


    // Simple drag and drop logic
    const onDragStart = (groupIndex: number, itemIndex: number) => {
        setDraggedItem({ groupIndex, itemIndex });
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (targetGroupIndex: number) => {
        if (!draggedItem) return;

        const { groupIndex: sourceGroupIndex, itemIndex: sourceItemIndex } = draggedItem;

        if (sourceGroupIndex === targetGroupIndex) {
            setDraggedItem(null);
            return;
        }

        const newGroups = [...groups];
        const [movedItem] = newGroups[sourceGroupIndex].items.splice(sourceItemIndex, 1);
        newGroups[targetGroupIndex].items.push(movedItem);

        onChange(newGroups);
        setDraggedItem(null);
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Categorization Builder</label>
                <button
                    onClick={handleAddGroup}
                    className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Add Category
                </button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {groups.map((group, gIdx) => (
                    <div
                        key={group.uuid}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(gIdx)}
                        className="min-w-[300px] w-80 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[600px]"
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between group/header">
                            <input
                                type="text"
                                value={group.title}
                                onChange={(e) => handleUpdateGroupTitle(gIdx, e.target.value)}
                                className="bg-transparent border-none font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0 text-sm"
                                placeholder="Category Title"
                            />
                            <button
                                onClick={() => handleRemoveGroup(gIdx)}
                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/header:opacity-100"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>

                        {/* Column Body - Cards */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[100px]">
                            <AnimatePresence initial={false}>
                                {group.items.map((item, iIdx) => (
                                    <motion.div
                                        key={item.uuid}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        draggable
                                        onDragStart={() => onDragStart(gIdx, iIdx)}
                                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 group relative cursor-move hover:shadow-md hover:border-primary/30 transition-all"
                                    >
                                        {/* Item Drag Handle & Delete */}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-slate-300 text-lg">drag_indicator</span>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveItem(gIdx, iIdx)}
                                            className="absolute -right-2 -top-2 size-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>

                                        {/* Card Image */}
                                        <div className="mb-3">
                                            {item.previewUrl || item.media?.url ? (
                                                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                                                    <img
                                                        src={item.previewUrl || item.media?.url}
                                                        className="w-full h-full object-cover"
                                                        alt="Item"
                                                    />
                                                    <button
                                                        onClick={() => handleItemImageDelete(gIdx, iIdx)}
                                                        className="absolute top-1 right-1 size-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="block w-full h-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleItemImageUpload(gIdx, iIdx, file);
                                                        }}
                                                    />
                                                    <span className="material-symbols-outlined text-slate-300 text-sm">add_photo_alternate</span>
                                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Image</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Card Text */}
                                        <RichTextEditor
                                            value={item.content}
                                            onChange={(val) => handleUpdateItemContent(gIdx, iIdx, val)}
                                            placeholder="Item content..."
                                            minHeight="min-h-[60px]"
                                            className="text-sm"
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add Item Button */}
                            <button
                                onClick={() => handleAddItem(gIdx)}
                                className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary hover:bg-white dark:hover:bg-slate-900 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Add Item
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
