import { useState, useEffect } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import QuestionToolbar from '@/components/questions/QuestionToolbar';

interface StudentEssayInputProps {
    selectedAnswer: string | null;
    onChange: (value: string) => void;
    showAnswer?: boolean;
    keyAnswer?: {
        rubric?: any;
        answers?: string[];
    };
}

export default function StudentEssayInput({ selectedAnswer, onChange, showAnswer, keyAnswer }: StudentEssayInputProps) {
    const [value, setValue] = useState(selectedAnswer || '');

    useEffect(() => {
        setValue(selectedAnswer || '');
    }, [selectedAnswer]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
    };

    const handleBlur = () => {
        onChange(value);
    };

    const stripHtml = (html: string) => {
        if (typeof window === 'undefined') return html;
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const plainText = stripHtml(value);
    const charCount = plainText.length;
    const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

    const rubricContent = keyAnswer?.rubric;
    const hasRubric = rubricContent && Object.keys(rubricContent).length > 0;

    return (
        <div className="space-y-4">
            {showAnswer && hasRubric && (
                <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">
                        Rubrik / Kunci Jawaban
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200">
                        {typeof rubricContent === 'string' ? rubricContent : JSON.stringify(rubricContent, null, 2)}
                    </div>
                </div>
            )}

            <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 flex flex-wrap gap-2">
                    <QuestionToolbar />
                </div>
                <RichTextEditor
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Write your answer here..."
                    className="w-full p-4 min-h-[256px] bg-transparent pb-12"
                    minHeight="min-h-[256px]"
                />
            </div>
            <div className="flex justify-between text-xs text-slate-400 px-2 font-medium">
                <span>Characters: {charCount}</span>
                <span>Words: {wordCount}</span>
            </div>
        </div>
    );
}

