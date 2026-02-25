import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ArabicNodeView from './ArabicNodeView';

export interface ArabicOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        arabic: {
            /**
             * Set an arabic node
             */
            setArabic: (attributes: { text: string }) => ReturnType;
            /**
             * Update an arabic node
             */
            updateArabic: (attributes: { text: string }) => ReturnType;
        };
    }
}

export const ArabicExtension = Node.create<ArabicOptions>({
    name: 'arabic',

    group: 'inline',

    inline: true,

    selectable: true,

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            text: {
                default: '',
                parseHTML: element => element.getAttribute('data-arabic'),
                renderHTML: attributes => ({
                    'data-arabic': attributes.text,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-arabic]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const text = HTMLAttributes['data-arabic'] || '';
        return [
            'span',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: 'font-arabic text-xl leading-relaxed',
                dir: 'rtl'
            }),
            text
        ];
    },

    addCommands() {
        return {
            setArabic:
                attributes =>
                    ({ chain }) => {
                        return chain().insertContent({ type: this.name, attrs: attributes }).run();
                    },
            updateArabic:
                attributes =>
                    ({ commands }) => {
                        return commands.updateAttributes(this.name, attributes);
                    },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ArabicNodeView);
    },
});
