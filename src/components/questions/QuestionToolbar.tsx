import { useEditorStore } from '@/store/useEditorStore';
import MathDialog from './MathDialog';
import ArabicDialog from './ArabicDialog';
import JavaneseDialog from './JavaneseDialog';

export default function QuestionToolbar() {
    const {
        activeEditor,
        isMathDialogOpen,
        setIsMathDialogOpen,
        isArabicDialogOpen,
        setIsArabicDialogOpen,
        isJavaneseDialogOpen,
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

    const openMathDialog = () => {
        setIsMathDialogOpen(true);
    };

    const handleMathConfirm = (latex: string) => {
        const { state } = activeEditor;
        const { from } = state.selection;
        const node = state.doc.nodeAt(from);

        if (node && node.type.name === 'math') {
            activeEditor.chain().focus().updateMath({ latex }).run();
        } else {
            activeEditor.chain().focus().setMath({ latex }).run();
        }
    };

    const openArabicDialog = () => {
        setIsArabicDialogOpen(true);
    };

    const handleArabicConfirm = (text: string) => {
        const { state } = activeEditor;
        const { from } = state.selection;
        const node = state.doc.nodeAt(from);

        if (node && node.type.name === 'arabic') {
            activeEditor.chain().focus().updateArabic({ text }).run();
        } else {
            activeEditor.chain().focus().setArabic({ text }).run();
        }
    };

    const openJavaneseDialog = () => {
        setIsJavaneseDialogOpen(true);
    };

    const handleJavaneseConfirm = (text: string) => {
        const { state } = activeEditor;
        const { from } = state.selection;
        const node = state.doc.nodeAt(from);

        if (node && node.type.name === 'javanese') {
            activeEditor.chain().focus().updateJavanese({ text }).run();
        } else {
            activeEditor.chain().focus().setJavanese({ text }).run();
        }
    };

    const currentMathLatex = activeEditor.isActive('math')
        ? activeEditor.getAttributes('math').latex
        : '';

    const currentArabicText = activeEditor.isActive('arabic')
        ? activeEditor.getAttributes('arabic').text
        : '';

    const currentJavaneseText = activeEditor.isActive('javanese')
        ? activeEditor.getAttributes('javanese').text
        : '';

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <ToolbarButton
                onClick={toggleBold}
                active={activeEditor.isActive('bold')}
                icon="format_bold"
                tooltip="Bold"
            />
            <ToolbarButton
                onClick={toggleItalic}
                active={activeEditor.isActive('italic')}
                icon="format_italic"
                tooltip="Italic"
            />
            <ToolbarButton
                onClick={toggleUnderline}
                active={activeEditor.isActive('underline')}
                icon="format_underlined"
                tooltip="Underline"
            />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <ToolbarButton
                onClick={toggleBulletList}
                active={activeEditor.isActive('bulletList')}
                icon="format_list_bulleted"
                tooltip="Bullet List"
            />
            <ToolbarButton
                onClick={toggleOrderedList}
                active={activeEditor.isActive('orderedList')}
                icon="format_list_numbered"
                tooltip="Numbered List"
            />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <ToolbarButton
                onClick={openMathDialog}
                active={activeEditor.isActive('math')}
                icon="functions"
                tooltip="Math Formula"
            />
            <ToolbarButton
                onClick={openArabicDialog}
                active={activeEditor.isActive('arabic')}
                icon="translate"
                tooltip="Arabic Text"
            />
            <ToolbarButton
                onClick={openJavaneseDialog}
                active={activeEditor.isActive('javanese')}
                icon="history_edu"
                tooltip="Javanese Script"
            />

            <MathDialog
                isOpen={isMathDialogOpen}
                onClose={() => setIsMathDialogOpen(false)}
                initialValue={currentMathLatex}
                onConfirm={handleMathConfirm}
            />

            <ArabicDialog
                isOpen={isArabicDialogOpen}
                onClose={() => setIsArabicDialogOpen(false)}
                initialValue={currentArabicText}
                onConfirm={handleArabicConfirm}
            />

            <JavaneseDialog
                isOpen={isJavaneseDialogOpen}
                onClose={() => setIsJavaneseDialogOpen(false)}
                initialValue={currentJavaneseText}
                onConfirm={handleJavaneseConfirm}
            />
        </div>
    );
}

function ToolbarButton({ onClick, active, icon, tooltip }: { onClick: () => void; active: boolean; icon: string; tooltip: string }) {
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
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </button>
    );
}
