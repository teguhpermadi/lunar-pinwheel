import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { MathExtension } from '@/lib/tiptap/MathExtension';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

// Helper to convert $latex$ in HTML to data-latex spans for TipTap
const toEditorHtml = (html: string) => {
    if (!html) return '';
    // Replace $...$ with <span data-latex="...">$...$</span>
    // Use a negative lookahead to avoid matching already wrapped spans or other $ signs
    return html.replace(/\$([^$]+)\$/g, (match, latex) => {
        return `<span data-latex="${latex}">$${latex}$</span>`;
    });
};

// Helper to convert data-latex spans back to simple $latex$ for DB
const toPersistenceHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('span[data-latex]').forEach(span => {
        const latex = span.getAttribute('data-latex');
        if (latex) {
            span.replaceWith(`$${latex}$`);
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
