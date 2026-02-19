import { useState } from 'react';
import Swal from 'sweetalert2';

interface MatchingPair {
    id?: string;
    uuid: string;
    left: string; // The question item
    right: string; // The answer match
}

interface MatchingInputProps {
    pairs: MatchingPair[];
    onChange: (pairs: MatchingPair[]) => void;
}

export default function MatchingInput({ pairs, onChange }: MatchingInputProps) {
    const handleAddPair = () => {
        const newPair: MatchingPair = {
            uuid: crypto.randomUUID(),
            left: '',
            right: ''
        };
        onChange([...pairs, newPair]);
    };

    const handleRemovePair = (uuid: string) => {
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
        onChange(pairs.filter(p => p.uuid !== uuid));
    };

    const handleChange = (uuid: string, field: 'left' | 'right', value: string) => {
        onChange(pairs.map(p => p.uuid === uuid ? { ...p, [field]: value } : p));
    };

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

            <div className="space-y-4">
                {pairs.map((pair, index) => (
                    <div key={pair.uuid} className="grid grid-cols-[1fr,40px,1fr] gap-4 items-start relative group">
                        {/* Remove button outside grid or absolute */}
                        <button
                            onClick={() => handleRemovePair(pair.uuid)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <textarea
                                value={pair.left}
                                onChange={(e) => handleChange(pair.uuid, 'left', e.target.value)}
                                className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 resize-none h-16"
                                placeholder={`Item ${index + 1}`}
                            />
                        </div>

                        <div className="flex items-center justify-center h-full">
                            <span className="material-symbols-outlined text-slate-300">link</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <textarea
                                value={pair.right}
                                onChange={(e) => handleChange(pair.uuid, 'right', e.target.value)}
                                className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 resize-none h-16"
                                placeholder={`Match for Item ${index + 1}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
