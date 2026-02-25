import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

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
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
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
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
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
