import { Reorder } from 'framer-motion';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface SequenceItem {
    id?: string;
    uuid: string;
    content: string;
    order: number;
}

interface SequenceInputProps {
    items: SequenceItem[];
    onChange: (items: SequenceItem[]) => void;
}

export default function SequenceInput({ items, onChange }: SequenceInputProps) {
    const handleAddStep = () => {
        const newItem: SequenceItem = {
            uuid: crypto.randomUUID(),
            content: '',
            order: items.length + 1
        };
        onChange([...items, newItem]);
    };

    const handleRemoveStep = (uuid: string) => {
        if (items.length <= 2) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Minimum 2 steps required',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }
        const newItems = items.filter(i => i.uuid !== uuid);
        // Re-order
        const reOrdered = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
        onChange(reOrdered);
    };

    const handleReorder = (newOrder: SequenceItem[]) => {
        const reOrdered = newOrder.map((item, idx) => ({ ...item, order: idx + 1 }));
        onChange(reOrdered);
    };

    const handleContentChange = (uuid: string, content: string) => {
        onChange(items.map(item => item.uuid === uuid ? { ...item, content } : item));
    };

    return (
        <section className="space-y-6">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Sequence Order (Correct Answer)</label>

            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
                {items.map((item, index) => (
                    <Reorder.Item key={item.uuid} value={item} className="cursor-grab active:cursor-grabbing">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                            <div className="text-slate-300">
                                <span className="material-symbols-outlined">drag_indicator</span>
                            </div>

                            <div className="size-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <RichTextEditor
                                    value={item.content}
                                    onChange={(val) => handleContentChange(item.uuid, val)}
                                    placeholder={`Step ${index + 1}`}
                                    minHeight="min-h-[44px]"
                                    className="text-sm p-0"
                                />
                            </div>

                            <button
                                onClick={() => handleRemoveStep(item.uuid)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <button
                onClick={handleAddStep}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 mb-12"
            >
                <span className="material-symbols-outlined">add_circle</span>
                Add Sequence Step
            </button>
        </section>
    );
}
