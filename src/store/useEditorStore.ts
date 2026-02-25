import { create } from 'zustand';
import { Editor } from '@tiptap/react';

interface EditorState {
    activeEditor: Editor | null;
    isMathDialogOpen: boolean;
    isArabicDialogOpen: boolean;
    setActiveEditor: (editor: Editor | null) => void;
    setIsMathDialogOpen: (open: boolean) => void;
    setIsArabicDialogOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    activeEditor: null,
    isMathDialogOpen: false,
    isArabicDialogOpen: false,
    setActiveEditor: (editor) => set({ activeEditor: editor }),
    setIsMathDialogOpen: (open) => set({ isMathDialogOpen: open }),
    setIsArabicDialogOpen: (open) => set({ isArabicDialogOpen: open }),
}));
