import { useState, useEffect } from 'react';
import { QuestionOption } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import { Reorder } from 'framer-motion';

interface StudentSequenceInputProps {
    options: QuestionOption[];
    selectedAnswer: string[] | null; // e.g. ["A", "C", "B"]
    onChange: (value: string[]) => void;
}

export default function StudentSequenceInput({ options, selectedAnswer, onChange }: StudentSequenceInputProps) {
    const [items, setItems] = useState<QuestionOption[]>([]);

    useEffect(() => {
        if (selectedAnswer && selectedAnswer.length > 0) {
            // Reconstruct order from selectedAnswer keys
            const map = new Map(options.map(o => [o.option_key, o]));
            const ordered = selectedAnswer.map(key => map.get(key)).filter(Boolean) as QuestionOption[];
            // If some options are missing from selectedAnswer (not yet answered?), append them
            const missing = options.filter(o => !selectedAnswer.includes(o.option_key));
            setItems([...ordered, ...missing]);
        } else {
            // Initial state: shuffle items for students
            setItems([...options].sort(() => Math.random() - 0.5));
        }
    }, [options, selectedAnswer]);

    const handleReorder = (newItems: QuestionOption[]) => {
        setItems(newItems);
        onChange(newItems.map(i => i.option_key));
    };

    return (
        <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-icons text-sm">drag_indicator</span>
                Drag and drop to reorder the sequence
            </p>

            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
                {items.map((item) => (
                    <Reorder.Item
                        key={item.id}
                        value={item}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing transition-colors hover:border-primary/20"
                    >
                        <div className="size-8 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            <span className="material-icons text-sm">drag_indicator</span>
                        </div>

                        <div className="flex-1">
                            <MathRenderer content={item.content} className="text-lg font-medium text-gray-700 dark:text-gray-200" />
                        </div>

                        <div className="size-8 bg-primary/5 text-primary text-[10px] font-black rounded-full flex items-center justify-center shrink-0 border border-primary/10">
                            {items.indexOf(item) + 1}
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
}
