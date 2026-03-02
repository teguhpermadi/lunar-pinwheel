import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';

interface MathKeyProps {
    label: string | React.ReactNode;
    latex?: string;
    onClick: (latex: string) => void;
    className?: string;
    command?: string;
}

const MathKey = ({ label, latex, onClick, className = "", command }: MathKeyProps) => {
    return (
        <button
            type="button"
            onClick={() => onClick(latex || label as string)}
            className={`flex items-center justify-center p-1 sm:p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary/50 transition-all cursor-pointer aspect-square sm:aspect-auto min-h-[36px] sm:min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
        >
            {label}
        </button>
    );
};

interface MathKeyboardProps {
    onKeyClick: (latex: string, command?: string) => void;
    onBackspace: () => void;
}

interface KeyboardKey {
    label: string | React.ReactNode;
    latex?: string;
    className?: string;
}

interface Categories {
    basic: {
        keypad: KeyboardKey[];
        operations: KeyboardKey[];
    };
    calculus: KeyboardKey[];
    greek: KeyboardKey[];
}

export default function MathKeyboard({ onKeyClick, onBackspace }: MathKeyboardProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'calculus' | 'greek'>('basic');

    const handleKeyClick = (latex: string) => {
        onKeyClick(latex);
    };

    const tabs = [
        { id: 'basic', label: 'Basic' },
        { id: 'calculus', label: 'Calculus' },
        { id: 'greek', label: 'Greek' },
    ];

    const categories: Categories = {
        basic: {
            keypad: [
                { label: '7', className: 'font-bold text-primary' },
                { label: '8', className: 'font-bold text-primary' },
                { label: '9', className: 'font-bold text-primary' },
                { label: '4', className: 'font-bold text-primary' },
                { label: '5', className: 'font-bold text-primary' },
                { label: '6', className: 'font-bold text-primary' },
                { label: '1', className: 'font-bold text-primary' },
                { label: '2', className: 'font-bold text-primary' },
                { label: '3', className: 'font-bold text-primary' },
                { label: '0', className: 'font-bold text-primary col-span-2' },
                { label: '.', className: 'font-bold text-primary' },
            ],
            operations: [
                { label: 'π', latex: '\\pi' },
                { label: '√', latex: '\\sqrt{}' },
                { label: 'x²', latex: '^2' },
                { label: 'xⁿ', latex: '^' },
                { label: <div className="flex flex-col items-center leading-[0.8] text-[10px] sm:text-xs"><span className="border-b-[1.5px] border-current px-[2px] pb-[1px]">a</span><span className="pt-[1px] px-[2px]">b</span></div>, latex: '\\frac' },
                { label: '±', latex: '\\pm' },
                { label: '÷', latex: '\\div' },
                { label: '(', latex: '(' },
                { label: ')', latex: ')' },
                { label: '[', latex: '[' },
                { label: ']', latex: ']' },
                { label: '{', latex: '{' },
                { label: '}', latex: '}' },
                { label: '+', className: 'bg-slate-50 dark:bg-slate-800 font-bold' },
                { label: '-', className: 'bg-slate-50 dark:bg-slate-800 font-bold' },
                { label: '×', latex: '\\times', className: 'bg-slate-50 dark:bg-slate-800 font-bold' },
                { label: '≠', latex: '\\neq' },
            ]
        },
        calculus: [
            { label: 'Σ', latex: '\\sum' },
            { label: '∫', latex: '\\int' },
            { label: '∞', latex: '\\infty' },
            { label: '≠', latex: '\\neq' },
            { label: '≤', latex: '\\le' },
            { label: '≥', latex: '\\ge' },
            { label: 'sin', latex: '\\sin' },
            { label: 'cos', latex: '\\cos' },
            { label: 'tan', latex: '\\tan' },
            { label: 'log', latex: '\\log' },
            { label: 'ln', latex: '\\ln' },
            { label: 'e', latex: 'e' },
            { label: 'lim', latex: '\\lim_{x \\to \\infty}' },
            { label: 'd/dx', latex: '\\frac{d}{dx}' },
            { label: '∂', latex: '\\partial' },
            { label: '∫dx', latex: '\\int dx' },
        ],
        greek: [
            { label: 'α', latex: '\\alpha' },
            { label: 'β', latex: '\\beta' },
            { label: 'γ', latex: '\\gamma' },
            { label: 'δ', latex: '\\delta' },
            { label: 'ε', latex: '\\epsilon' },
            { label: 'ζ', latex: '\\zeta' },
            { label: 'η', latex: '\\eta' },
            { label: 'θ', latex: '\\theta' },
            { label: 'λ', latex: '\\lambda' },
            { label: 'μ', latex: '\\mu' },
            { label: 'σ', latex: '\\sigma' },
            { label: 'ω', latex: '\\omega' },
            { label: 'Δ', latex: '\\Delta' },
            { label: 'Ω', latex: '\\Omega' },
            { label: 'Φ', latex: '\\Phi' },
            { label: 'Ψ', latex: '\\Psi' },
        ]
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 gap-3 sm:gap-0">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Math Symbols & Functions</span>
                <div className="flex gap-1.5 sm:gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 sm:py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative overflow-hidden min-h-[220px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        {activeTab === 'basic' ? (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                                <div className="md:col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 border-b md:border-b-0 border-slate-100 dark:border-slate-800 md:border-r pb-4 md:pb-0 md:pr-4">
                                    {categories.basic.keypad.map((key, idx) => (
                                        <MathKey
                                            key={`keypad-${idx}`}
                                            label={key.label}
                                            latex={key.latex}
                                            className={key.className}
                                            onClick={handleKeyClick}
                                        />
                                    ))}
                                </div>
                                <div className="md:col-span-7 grid grid-cols-4 gap-1.5 sm:gap-2 relative">
                                    {categories.basic.operations.map((key, idx) => (
                                        <MathKey
                                            key={`ops-${idx}`}
                                            label={key.label}
                                            latex={key.latex}
                                            className={key.className}
                                            onClick={handleKeyClick}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={onBackspace}
                                        className="math-key col-span-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30 flex items-center justify-center p-2 rounded-lg border min-h-[36px] sm:min-h-[40px]"
                                    >
                                        <Delete size={16} className="mr-1 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Backspace</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
                                {(categories[activeTab] as KeyboardKey[]).map((key, idx) => (
                                    <MathKey
                                        key={`${activeTab}-${idx}`}
                                        label={key.label}
                                        latex={key.latex}
                                        className={key.className}
                                        onClick={handleKeyClick}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={onBackspace}
                                    className="math-key col-span-full sm:col-span-2 md:col-span-1 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30 flex items-center justify-center p-2 rounded-lg border aspect-auto sm:aspect-square min-h-[36px] sm:min-h-[40px]"
                                >
                                    <Delete size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider ml-2 sm:hidden md:hidden">Backspace</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
