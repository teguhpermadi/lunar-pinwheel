import { useRef, useEffect, useState } from 'react';
import MathKeyboard from '@/components/ui/MathKeyboard';

declare global {
    interface Window {
        MathQuill: any;
        jQuery: any;
        $: any;
    }
}

interface MathInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function MathInput({ value, onChange, placeholder = "Enter math expression...", className = "" }: MathInputProps) {
    const mathFieldRef = useRef<HTMLSpanElement>(null);
    const mqRef = useRef<any>(null);
    const [internalValue, setInternalValue] = useState(value);

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
                if (value) {
                    mqRef.current.latex(value);
                }
            }
        };

        // Retry if not yet loaded (CDN timing)
        const checkInterval = setInterval(() => {
            if (window.MathQuill && window.jQuery) {
                initMathQuill();
                clearInterval(checkInterval);
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, []);

    // Synchronize external value changes (e.g. from parent/reset)
    useEffect(() => {
        if (mqRef.current && value !== internalValue) {
            mqRef.current.latex(value);
            setInternalValue(value);
        }
    }, [value]);

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
        <div className={`space-y-6 w-full ${className}`}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all flex flex-col cursor-text hover:border-primary/30"
                onClick={focusInput}
            >
                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-8 py-12 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center">
                    <span
                        ref={mathFieldRef}
                        className="w-full text-3xl text-slate-800 dark:text-slate-100 border-none outline-none block [&_.mq-root-block]:py-4 [&_.mq-root-block]:min-h-[1.5em]"
                        title={placeholder}
                    ></span>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MathKeyboard
                    onKeyClick={handleKeyClick}
                    onBackspace={handleBackspace}
                />
            </div>
        </div>
    );
}
