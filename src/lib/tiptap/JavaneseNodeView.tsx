import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEditorStore } from '@/store/useEditorStore';

const JavaneseNodeView = (props: NodeViewProps) => {
    const { setIsJavaneseDialogOpen } = useEditorStore();
    const { text } = props.node.attrs;

    return (
        <NodeViewWrapper
            as="span"
            className={`inline-block mx-0.5 px-1 rounded transition-all cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/20 font-javanese text-xl leading-relaxed align-middle ${props.selected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                }`}
            data-javanese={text}
            onClick={() => setIsJavaneseDialogOpen(true)}
        >
            {text || '...'}
        </NodeViewWrapper>
    );
};

export default JavaneseNodeView;
