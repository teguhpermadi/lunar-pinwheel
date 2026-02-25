import { create } from 'zustand';
import { Editor } from '@tiptap/react';

interface EditorState {
    activeEditor: Editor | null;
    setActiveEditor: (editor: Editor | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    activeEditor: null,
    setActiveEditor: (editor) => set({ activeEditor: editor }),
}));
