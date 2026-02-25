import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MathNodeView from './MathNodeView.tsx';

export interface MathOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        math: {
            /**
             * Set a math node
             */
            setMath: (attributes: { latex: string }) => ReturnType;
            /**
             * Update a math node
             */
            updateMath: (attributes: { latex: string }) => ReturnType;
        };
    }
}

export const inputRuleRegExp = /\$([^$]+)\$$/;

export const MathExtension = Node.create<MathOptions>({
    name: 'math',

    group: 'inline',

    inline: true,

    selectable: true,

    draggable: true,

    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '',
                parseHTML: element => element.getAttribute('data-latex'),
                renderHTML: attributes => ({
                    'data-latex': attributes.latex,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-latex]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const latex = HTMLAttributes.latex || '';
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), `$${latex}$`];
    },

    addCommands() {
        return {
            setMath:
                attributes =>
                    ({ chain }) => {
                        return chain().insertContent({ type: this.name, attrs: attributes }).run();
                    },
            updateMath:
                attributes =>
                    ({ commands }) => {
                        return commands.updateAttributes(this.name, attributes);
                    },
        };
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: inputRuleRegExp,
                type: this.type,
                getAttributes: match => {
                    return {
                        latex: match[1],
                    };
                },
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathNodeView);
    },
});
