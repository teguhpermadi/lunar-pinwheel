import { useState, useEffect, useRef } from 'react';
import ArabicKeyboard from '@/components/ui/ArabicKeyboard';
import JavaneseKeyboard from '@/components/ui/JavaneseKeyboard';

interface StudentLanguageResponseInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
    language: 'arabic' | 'javanese';
}

export default function StudentLanguageResponseInput({ selectedAnswer, onChange, language }: StudentLanguageResponseInputProps) {
    const [value, setValue] = useState(selectedAnswer || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        setValue(selectedAnswer || '');
    }, [selectedAnswer]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onChange(newValue);
    };

    const handleKeyClick = (char: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value;

        let newValue = text.substring(0, start) + char + text.substring(end);
        let cursorOffset = char.length;

        // Arabic diacritics logic
        if (language === 'arabic') {
            const vowels = ['َ', 'ُ', 'ِ', 'ً', 'ٌ', 'ٍ', 'ْ'];
            const shadda = 'ّ';
            const diacritics = [...vowels, shadda];

            if (diacritics.includes(char) && start === end && start > 0) {
                const prevChar = text.substring(start - 1, start);
                if (diacritics.includes(prevChar)) {
                    if (char === prevChar) {
                        newValue = text.substring(0, start - 1) + char + text.substring(end);
                        cursorOffset = 0;
                    } else if (vowels.includes(char) && vowels.includes(prevChar)) {
                        newValue = text.substring(0, start - 1) + char + text.substring(end);
                        cursorOffset = 0;
                    }
                }
            }
        }

        setValue(newValue);
        onChange(newValue);

        // Maintain focus and set cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    const handleBackspace = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value;

        let newValue = '';
        let newCursorPos = 0;

        if (start === end && start > 0) {
            newValue = text.substring(0, start - 1) + text.substring(end);
            newCursorPos = start - 1;
        } else if (start !== end) {
            newValue = text.substring(0, start) + text.substring(end);
            newCursorPos = start;
        } else {
            return;
        }

        setValue(newValue);
        onChange(newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleSpace = () => handleKeyClick(' ');

    return (
        <div className="space-y-6">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                inputMode={isMobile ? "none" : undefined}
                placeholder={language === 'arabic' ? 'اكتب إجابتك هنا...' : 'Serat wangsulan panjenengan wonten mriki...'}
                dir={language === 'arabic' ? 'rtl' : 'ltr'}
                className={`w-full h-48 p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all custom-scrollbar resize-none text-center leading-relaxed ${language === 'arabic' ? 'font-arabic' : 'font-javanese'
                    }`}
            />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {language === 'arabic' ? (
                    <ArabicKeyboard
                        onKeyClick={handleKeyClick}
                        onBackspace={handleBackspace}
                        onSpace={handleSpace}
                    />
                ) : (
                    <JavaneseKeyboard
                        onKeyClick={handleKeyClick}
                        onBackspace={handleBackspace}
                        onSpace={handleSpace}
                    />
                )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
                <span className="material-icons text-blue-500 text-sm">info</span>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed uppercase tracking-wider font-bold">
                    {language === 'arabic' ? 'Arabic Keyboard Active' : 'Javanese Keyboard Active'}
                    <span className="block font-medium normal-case mt-1 opacity-70">
                        Use the virtual keyboard provided for specialized characters. Your progress is saved automatically.
                    </span>
                </p>
            </div>
        </div>
    );
}
