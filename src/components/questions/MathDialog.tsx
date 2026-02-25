import { useRef, useEffect, useState } from 'react';
import Modal from '@/components/ui/modal';
import MathKeyboard from '@/components/ui/MathKeyboard';

interface MathDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialValue?: string;
    onConfirm: (latex: string) => void;
}

export default function MathDialog({ isOpen, onClose, initialValue = '', onConfirm }: MathDialogProps) {
    const mathFieldRef = useRef<HTMLSpanElement>(null);
    const mqRef = useRef<any>(null);
    const [latex, setLatex] = useState(initialValue);

    // Reset latex when dialog opens with a new initialValue
    useEffect(() => {
        if (isOpen) {
            setLatex(initialValue);
        }
    }, [isOpen, initialValue]);

    useEffect(() => {
        if (!isOpen) return;

        const initMathQuill = () => {
            if (window.MathQuill && mathFieldRef.current && !mqRef.current) {
                const MQ = window.MathQuill.getInterface(2);

                mqRef.current = MQ.MathField(mathFieldRef.current, {
                    handlers: {
                        edit: () => {
                            setLatex(mqRef.current.latex());
                        }
                    },
                    autoFocus: true
                });

                if (initialValue) {
                    mqRef.current.latex(initialValue);
                }
            }
        };

        const checkInterval = setInterval(() => {
            if (window.MathQuill && window.jQuery) {
                initMathQuill();
                clearInterval(checkInterval);
            }
        }, 100);

        return () => {
            clearInterval(checkInterval);
            mqRef.current = null;
        };
    }, [isOpen]);

    const handleKeyClick = (keyLatex: string) => {
        if (mqRef.current) {
            if (keyLatex === '^') {
                mqRef.current.cmd('^');
            } else if (keyLatex === '^2') {
                mqRef.current.write('^2');
            } else if (keyLatex === '\\sqrt{}') {
                mqRef.current.cmd('\\sqrt');
            } else if (['\\sum', '\\get', '\\int', '(', '[', '{'].includes(keyLatex)) {
                mqRef.current.cmd(keyLatex);
            } else if (keyLatex.startsWith('\\')) {
                mqRef.current.write(keyLatex);
            } else {
                mqRef.current.typedText(keyLatex);
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

    const handleConfirm = () => {
        onConfirm(latex);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mathematical Formula">
            <div className="space-y-6">
                <div
                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 py-4 border-2 border-slate-100 dark:border-slate-700/50 flex items-center justify-center cursor-text min-h-[80px]"
                    onClick={() => mqRef.current?.focus()}
                >
                    <span
                        ref={mathFieldRef}
                        className="w-full text-md text-slate-800 dark:text-slate-100 border-none outline-none block [&_.mq-root-block]:py-4 [&_.mq-root-block]:min-h-[1.5em]"
                    ></span>
                </div>

                <MathKeyboard
                    onKeyClick={handleKeyClick}
                    onBackspace={handleBackspace}
                />

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                        <span className="material-symbols-outlined">check_circle</span>
                        Insert Formula
                    </button>
                </div>
            </div>
        </Modal>
    );
}
