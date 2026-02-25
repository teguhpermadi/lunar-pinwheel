import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEditorStore } from '@/store/useEditorStore';

const ArabicNodeView = (props: NodeViewProps) => {
    const { setIsArabicDialogOpen } = useEditorStore();
    const { text } = props.node.attrs;

    return (
        <NodeViewWrapper
            as="span"
            dir="rtl"
            className={`inline-block mx-0.5 px-1 rounded transition-all cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/20 font-arabic text-xl leading-relaxed align-middle ${props.selected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                }`}
            data-arabic={text}
            onClick={() => setIsArabicDialogOpen(true)}
        >
            {text || '...'}
        </NodeViewWrapper>
    );
};

export default ArabicNodeView;
