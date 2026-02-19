import { useState } from 'react';

interface EssayInputProps {
    // Essay might just rely on the main question content, but sometimes has keywords for auto-grading
    keywords?: string;
    onKeywordsChange?: (keywords: string) => void;
}

export default function EssayInput({ keywords = '', onKeywordsChange }: EssayInputProps) {
    return (
        <section className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-primary flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">edit_note</span>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Essay / Short Answer</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Students will answer this question with text. You can manually grade it later.
                    </p>
                </div>
            </div>

            {onKeywordsChange && (
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Auto-grading Keywords <span className="text-xs font-normal lowercase text-slate-400">(Optional, comma separated)</span>
                    </label>
                    <textarea
                        value={keywords}
                        onChange={(e) => onKeywordsChange(e.target.value)}
                        className="w-full h-24 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-primary focus:border-primary transition-all resize-none outline-none border"
                        placeholder="e.g. photosynthesis, light, energy"
                    />
                </div>
            )}
        </section>
    );
}
