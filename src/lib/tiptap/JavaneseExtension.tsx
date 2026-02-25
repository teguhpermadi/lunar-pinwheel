import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import JavaneseNodeView from './JavaneseNodeView';

export interface JavaneseOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        javanese: {
            /**
             * Set a javanese node
             */
            setJavanese: (attributes: { text: string }) => ReturnType;
            /**
             * Update a javanese node
             */
            updateJavanese: (attributes: { text: string }) => ReturnType;
        };
    }
}

export const JavaneseExtension = Node.create<JavaneseOptions>({
    name: 'javanese',

    group: 'inline',

    inline: true,

    selectable: true,

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            text: {
                default: '',
                parseHTML: element => element.getAttribute('data-javanese'),
                renderHTML: attributes => ({
                    'data-javanese': attributes.text,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-javanese]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const text = HTMLAttributes['data-javanese'] || '';
        return [
            'span',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: 'font-javanese text-xl leading-relaxed',
            }),
            text
        ];
    },

    addCommands() {
        return {
            setJavanese:
                attributes =>
                    ({ chain }) => {
                        return chain().insertContent({ type: this.name, attrs: attributes }).run();
                    },
            updateJavanese:
                attributes =>
                    ({ commands }) => {
                        return commands.updateAttributes(this.name, attributes);
                    },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(JavaneseNodeView);
    },
});
