import { useEditorStore } from '@/store/useEditorStore';
import MathDialog from './MathDialog';
import ArabicDialog from './ArabicDialog';
import JavaneseDialog from './JavaneseDialog';

export default function EditorDialogs() {
    const {
        activeEditor,
        isMathDialogOpen,
        setIsMathDialogOpen,
        isArabicDialogOpen,
        setIsArabicDialogOpen,
        isJavaneseDialogOpen,
        setIsJavaneseDialogOpen
    } = useEditorStore();

    if (!activeEditor) return null;

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
        <>
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
        </>
    );
}
