import { useEditorStore } from '@/store/useEditorStore';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Sigma,
    Languages,
    GraduationCap,
    type LucideIcon
} from 'lucide-react';

export default function QuestionToolbar() {
    const {
        activeEditor,
        setIsMathDialogOpen,
        setIsArabicDialogOpen,
        setIsJavaneseDialogOpen
    } = useEditorStore();

    if (!activeEditor) {
        return (
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 opacity-50 grayscale pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a field to format</span>
            </div>
        );
    }

    const toggleBold = () => activeEditor.chain().focus().toggleBold().run();
    const toggleItalic = () => activeEditor.chain().focus().toggleItalic().run();
    const toggleUnderline = () => activeEditor.chain().focus().toggleUnderline().run();
    const toggleBulletList = () => activeEditor.chain().focus().toggleBulletList().run();
    const toggleOrderedList = () => activeEditor.chain().focus().toggleOrderedList().run();

    const openMathDialog = () => setIsMathDialogOpen(true);
    const openArabicDialog = () => setIsArabicDialogOpen(true);
    const openJavaneseDialog = () => setIsJavaneseDialogOpen(true);

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1 min-w-max px-0.5">
                <ToolbarButton
                    onClick={toggleBold}
                    active={activeEditor.isActive('bold')}
                    icon={Bold}
                    tooltip="Bold"
                />
                <ToolbarButton
                    onClick={toggleItalic}
                    active={activeEditor.isActive('italic')}
                    icon={Italic}
                    tooltip="Italic"
                />
                <ToolbarButton
                    onClick={toggleUnderline}
                    active={activeEditor.isActive('underline')}
                    icon={Underline}
                    tooltip="Underline"
                />
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <ToolbarButton
                    onClick={toggleBulletList}
                    active={activeEditor.isActive('bulletList')}
                    icon={List}
                    tooltip="Bullet List"
                />
                <ToolbarButton
                    onClick={toggleOrderedList}
                    active={activeEditor.isActive('orderedList')}
                    icon={ListOrdered}
                    tooltip="Numbered List"
                />
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <ToolbarButton
                    onClick={openMathDialog}
                    active={activeEditor.isActive('math')}
                    icon={Sigma}
                    tooltip="Math Formula"
                />
                <ToolbarButton
                    onClick={openArabicDialog}
                    active={activeEditor.isActive('arabic')}
                    icon={Languages}
                    tooltip="Arabic Text"
                />
                <ToolbarButton
                    onClick={openJavaneseDialog}
                    active={activeEditor.isActive('javanese')}
                    icon={GraduationCap}
                    tooltip="Javanese Script"
                />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, active, icon: Icon, tooltip }: { onClick: () => void; active: boolean; icon: LucideIcon; tooltip: string }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={tooltip}
            className={`
                size-8 flex items-center justify-center rounded-lg transition-all
                ${active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
            `}
        >
            <Icon className="size-5" />
        </button>
    );
}
