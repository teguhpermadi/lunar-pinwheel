import { useState, useRef, useEffect } from 'react';
import ArabicKeyboard from '@/components/ui/ArabicKeyboard';

interface ArabicInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function ArabicInput({ value, onChange, placeholder = "Ketik dalam bahasa Arab...", className = "" }: ArabicInputProps) {
    const [internalValue, setInternalValue] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setInternalValue(value);
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [value]);


    const handleKeyClick = (char: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = internalValue;

        const vowels = ['َ', 'ُ', 'ِ', 'ً', 'ٌ', 'ٍ', 'ْ'];
        const shadda = 'ّ';
        const diacritics = [...vowels, shadda];

        let newValue;
        let cursorOffset = char.length;

        // Check if we are inserting a diacritic and if there's already one at the cursor position
        if (diacritics.includes(char) && start === end && start > 0) {
            const prevChar = text.substring(start - 1, start);

            if (diacritics.includes(prevChar)) {
                if (char === prevChar) {
                    // Same diacritic, just keep it (no change needed, but we'll "replace" it)
                    newValue = text.substring(0, start - 1) + char + text.substring(end);
                    cursorOffset = 0;
                } else if (vowels.includes(char) && vowels.includes(prevChar)) {
                    // Replace existing vowel with new vowel
                    newValue = text.substring(0, start - 1) + char + text.substring(end);
                    cursorOffset = 0;
                } else {
                    // Combination of Shadda and Vowel - allow appending
                    newValue = text.substring(0, start) + char + text.substring(end);
                }
            } else {
                newValue = text.substring(0, start) + char + text.substring(end);
            }
        } else {
            newValue = text.substring(0, start) + char + text.substring(end);
        }

        setInternalValue(newValue);
        onChange(newValue);

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
        const text = internalValue;

        if (start === end && start > 0) {
            const newValue = text.substring(0, start - 1) + text.substring(end);
            setInternalValue(newValue);
            onChange(newValue);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start - 1, start - 1);
            }, 0);
        } else if (start !== end) {
            const newValue = text.substring(0, start) + text.substring(end);
            setInternalValue(newValue);
            onChange(newValue);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start, start);
            }, 0);
        }
    };

    const handleSpace = () => {
        handleKeyClick(' ');
    };

    return (
        <div className={`space-y-6 w-full ${className}`}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:border-primary/30 overflow-hidden min-h-[180px] flex items-center justify-center px-8 bg-slate-50 dark:bg-slate-800/50">
                <textarea
                    ref={inputRef}
                    value={internalValue}
                    onChange={(e) => {
                        setInternalValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    dir="rtl"
                    className="w-full bg-transparent text-5xl text-slate-800 dark:text-slate-100 border-none outline-none focus:ring-0 font-arabic leading-relaxed text-center placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none py-4"
                    placeholder={placeholder}
                    rows={1}
                />
            </div>




            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ArabicKeyboard
                    onKeyClick={handleKeyClick}
                    onBackspace={handleBackspace}
                    onSpace={handleSpace}
                />
            </div>
        </div>
    );
}
