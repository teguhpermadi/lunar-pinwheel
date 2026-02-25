import { useRef, useEffect, useState } from 'react';
import Modal from '@/components/ui/modal';
import JavaneseKeyboard from '@/components/ui/JavaneseKeyboard';

interface JavaneseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialValue?: string;
    onConfirm: (text: string) => void;
}

export default function JavaneseDialog({ isOpen, onClose, initialValue = '', onConfirm }: JavaneseDialogProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState(initialValue);

    // Reset text when dialog opens with a new initialValue
    useEffect(() => {
        if (isOpen) {
            setText(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleKeyClick = (char: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;

        const newValue = text.substring(0, start) + char + text.substring(end);
        const cursorOffset = char.length;

        setText(newValue);

        // Maintain focus and set cursor position
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    const handleBackspace = () => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (start === end && start > 0) {
            const newValue = text.substring(0, start - 1) + text.substring(end);
            setText(newValue);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start - 1, start - 1);
            }, 0);
        } else if (start !== end) {
            const newValue = text.substring(0, start) + text.substring(end);
            setText(newValue);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start, start);
            }, 0);
        }
    };

    const handleSpace = () => {
        handleKeyClick(' ');
    };

    const handleConfirm = () => {
        onConfirm(text);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Javanese Script Input">
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center min-h-[100px]">
                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-transparent text-2xl text-slate-800 dark:text-slate-100 border-none outline-none focus:ring-0 font-javanese text-center resize-none leading-relaxed"
                        placeholder="Ketik dalam aksara Jawa..."
                        rows={2}
                        autoFocus
                    />
                </div>

                <JavaneseKeyboard
                    onKeyClick={handleKeyClick}
                    onBackspace={handleBackspace}
                    onSpace={handleSpace}
                />

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-sans"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all font-sans"
                    >
                        <span className="material-symbols-outlined">check_circle</span>
                        Insert Javanese Script
                    </button>
                </div>
            </div>
        </Modal>
    );
}
