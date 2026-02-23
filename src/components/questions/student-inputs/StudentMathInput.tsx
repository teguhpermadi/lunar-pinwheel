import { useRef, useEffect, useState } from 'react';
import MathKeyboard from '@/components/ui/MathKeyboard';

declare global {
    interface Window {
        MathQuill: any;
        jQuery: any;
        $: any;
    }
}

interface StudentMathInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
}

export default function StudentMathInput({ selectedAnswer, onChange }: StudentMathInputProps) {
    const mathFieldRef = useRef<HTMLSpanElement>(null);
    const mqRef = useRef<any>(null);
    const [internalValue, setInternalValue] = useState(selectedAnswer || '');

    useEffect(() => {
        // Wait for MathQuill and jQuery to be available from CDN
        const initMathQuill = () => {
            if (window.MathQuill && mathFieldRef.current && !mqRef.current) {
                const MQ = window.MathQuill.getInterface(2);

                mqRef.current = MQ.MathField(mathFieldRef.current, {
                    handlers: {
                        edit: () => {
                            const latex = mqRef.current.latex();
                            setInternalValue(latex);
                            onChange(latex);
                        }
                    },
                    spaceBehavesLikeTab: true,
                    restrictMismatchedBrackets: true,
                });

                // Set initial value
                if (selectedAnswer) {
                    mqRef.current.latex(selectedAnswer);
                }
            }
        };

        const checkInterval = setInterval(() => {
            if (window.MathQuill && window.jQuery) {
                initMathQuill();
                clearInterval(checkInterval);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, []);

    // Synchronize external value changes
    useEffect(() => {
        if (mqRef.current && selectedAnswer !== internalValue) {
            mqRef.current.latex(selectedAnswer || '');
            setInternalValue(selectedAnswer || '');
        }
    }, [selectedAnswer]);

    const handleKeyClick = (latex: string) => {
        if (mqRef.current) {
            if (latex === '^') {
                mqRef.current.cmd('^');
            } else if (latex === '^2') {
                mqRef.current.write('^2');
            } else if (latex === '\\sqrt{}') {
                mqRef.current.cmd('\\sqrt');
            } else if (latex === '\\sum' || latex === '\\get' || latex === '\\int') {
                mqRef.current.cmd(latex);
            } else if (latex === '(' || latex === '[' || latex === '{') {
                mqRef.current.cmd(latex);
            } else if (latex.startsWith('\\')) {
                mqRef.current.write(latex);
            } else {
                mqRef.current.typedText(latex);
            }
            mqRef.current.focus();
        }
    };

    const handleBackspace = () => {
        if (mqRef.current) {
            mqRef.current.keystroke('Backspace');
            mqRef.current.focus();
        }
    };

    const focusInput = () => {
        if (mqRef.current) {
            mqRef.current.focus();
        }
    };

    return (
        <div className="space-y-6">
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all flex flex-col cursor-text hover:border-primary/30"
                onClick={focusInput}
            >
                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-8 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mathematical Response</p>
                    <span
                        ref={mathFieldRef}
                        className="w-full text-2xl text-slate-800 dark:text-slate-100 border-none outline-none block [&_.mq-root-block]:py-2 [&_.mq-root-block]:min-h-[1.2em] text-center"
                    ></span>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MathKeyboard
                    onKeyClick={handleKeyClick}
                    onBackspace={handleBackspace}
                />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                <span className="material-icons text-blue-500 text-sm">info</span>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
                    Use the virtual keyboard provided or type standard LaTeX.
                    The answer is automatically saved as you type.
                </p>
            </div>
        </div>
    );
}
