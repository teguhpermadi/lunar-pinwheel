import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { MathExtension } from '@/lib/tiptap/MathExtension';
import { ArabicExtension } from '@/lib/tiptap/ArabicExtension';
import { JavaneseExtension } from '@/lib/tiptap/JavaneseExtension';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { 
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
    Heading1, Heading2, Heading3, Link2, Quote
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
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

interface MenuBarProps {
    editor: any;
}

function MenuBar({ editor }: MenuBarProps) {
    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt('Masukkan URL:');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const setHeading = (level: 1 | 2 | 3) => {
        editor.chain().focus().toggleHeading({ level }).run();
    };

    type ToolbarButton = { type: 'divider' } | { icon: typeof Bold; action: () => void; isActive: boolean; title: string };

    const buttons: ToolbarButton[] = [
        { 
            icon: Bold, 
            action: () => editor.chain().focus().toggleBold().run(), 
            isActive: editor.isActive('bold'),
            title: 'Bold'
        },
        { 
            icon: Italic, 
            action: () => editor.chain().focus().toggleItalic().run(), 
            isActive: editor.isActive('italic'),
            title: 'Italic'
        },
        { 
            icon: UnderlineIcon, 
            action: () => editor.chain().focus().toggleUnderline().run(), 
            isActive: editor.isActive('underline'),
            title: 'Underline'
        },
        { type: 'divider' },
        { 
            icon: Heading1, 
            action: () => setHeading(1), 
            isActive: editor.isActive('heading', { level: 1 }),
            title: 'Heading 1'
        },
        { 
            icon: Heading2, 
            action: () => setHeading(2), 
            isActive: editor.isActive('heading', { level: 2 }),
            title: 'Heading 2'
        },
        { 
            icon: Heading3, 
            action: () => setHeading(3), 
            isActive: editor.isActive('heading', { level: 3 }),
            title: 'Heading 3'
        },
        { type: 'divider' },
        { 
            icon: List, 
            action: () => editor.chain().focus().toggleBulletList().run(), 
            isActive: editor.isActive('bulletList'),
            title: 'Bullet List'
        },
        { 
            icon: ListOrdered, 
            action: () => editor.chain().focus().toggleOrderedList().run(), 
            isActive: editor.isActive('orderedList'),
            title: 'Numbered List'
        },
        { 
            icon: Quote, 
            action: () => editor.chain().focus().toggleBlockquote().run(), 
            isActive: editor.isActive('blockquote'),
            title: 'Quote'
        },
        { type: 'divider' },
        { 
            icon: Link2, 
            action: addLink, 
            isActive: editor.isActive('link'),
            title: 'Link'
        },
    ];

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            {buttons.map((btn, i) => {
                if ('type' in btn && btn.type === 'divider') {
                    return (
                        <div 
                            key={`divider-${i}`} 
                            className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" 
                        />
                    );
                }
                const button = btn as { icon: typeof Bold; action: () => void; isActive: boolean; title: string };
                return (
                    <button
                        key={i}
                        onClick={button.action}
                        title={button.title}
                        className={`
                            p-1.5 md:p-2 rounded-lg transition-colors flex items-center justify-center
                            ${button.isActive 
                                ? 'bg-primary text-white' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}
                        `}
                    >
                        {button.icon && <button.icon className="w-4 h-4" />}
                    </button>
                );
            })}
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    onBlur,
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
            Image.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-2xl border border-slate-200 dark:border-slate-800 max-w-full h-auto my-4 mx-auto block shadow-sm',
                },
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
        onBlur: () => {
            if (onBlur) {
                onBlur();
            }
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
        <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <MenuBar editor={editor} />
            <EditorContent
                editor={editor}
                className="flex-1 w-full p-4"
            />
        </div>
    );
}
