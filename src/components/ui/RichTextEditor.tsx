import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { MathExtension } from '@/lib/tiptap/MathExtension';
import { ArabicExtension } from '@/lib/tiptap/ArabicExtension';
import { JavaneseExtension } from '@/lib/tiptap/JavaneseExtension';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

// Helper to convert $latex$ and [ara]arabic[/ara] in HTML to data-latex spans for TipTap
const toEditorHtml = (html: string) => {
    if (!html) return '';

    let processed = html;

    // Math: $...$ -> <span data-latex="...">$...$</span>
    processed = processed.replace(/\$([^$]+)\$/g, (_, latex) => {
        return `<span data-latex="${latex}">$${latex}$</span>`;
    });

    // Arabic: [ara]...[/ara] -> <span data-arabic="...">...</span>
    processed = processed.replace(/\[ara\]([\s\S]*?)\[\/ara\]/g, (_, text) => {
        return `<span data-arabic="${text}">${text}</span>`;
    });

    // Javanese: [jav]...[/jav] -> <span data-javanese="...">...</span>
    processed = processed.replace(/\[jav\]([\s\S]*?)\[\/jav\]/g, (_, text) => {
        return `<span data-javanese="${text}">${text}</span>`;
    });

    return processed;
};

// Helper to convert data-latex and data-arabic spans back to simple delimiters for DB
const toPersistenceHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Math
    doc.querySelectorAll('span[data-latex]').forEach(span => {
        const latex = span.getAttribute('data-latex');
        if (latex) {
            span.replaceWith(`$${latex}$`);
        }
    });

    // Arabic
    doc.querySelectorAll('span[data-arabic]').forEach(span => {
        const text = span.getAttribute('data-arabic');
        if (text) {
            span.replaceWith(`[ara]${text}[/ara]`);
        }
    });

    // Javanese
    doc.querySelectorAll('span[data-javanese]').forEach(span => {
        const text = span.getAttribute('data-javanese');
        if (text) {
            span.replaceWith(`[jav]${text}[/jav]`);
        }
    });

    return doc.body.innerHTML;
};

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Type here...',
    className = '',
    minHeight = 'min-h-[100px]'
}: RichTextEditorProps) {
    const { setActiveEditor } = useEditorStore();

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            MathExtension,
            ArabicExtension,
            JavaneseExtension,
        ],
        content: toEditorHtml(value),
        onUpdate: ({ editor }) => {
            onChange(toPersistenceHtml(editor.getHTML()));
        },
        onFocus: ({ editor }) => {
            setActiveEditor(editor);
        },
        editorProps: {
            attributes: {
                class: `prose prose-slate dark:prose-invert max-w-none focus:outline-none ${minHeight} ${className}`,
            },
        },
    });

    // Update content if value changes externally (e.g. from state reset)
    useEffect(() => {
        if (editor) {
            const currentPersistenceHtml = toPersistenceHtml(editor.getHTML());
            if (value !== currentPersistenceHtml) {
                editor.commands.setContent(toEditorHtml(value));
            }
        }
    }, [value, editor]);

    // Cleanup active editor on unmount if this was the active one
    useEffect(() => {
        return () => {
            // We don't necessarily want to null it if another one just took focus,
            // but TipTap's focus event usually handles the swap.
        };
    }, []);

    if (!editor) {
        return <div className={`${minHeight} animate-pulse bg-slate-50 dark:bg-slate-800 rounded-xl`} />;
    }

    return (
        <EditorContent
            editor={editor}
            className="w-full"
        />
    );
}
