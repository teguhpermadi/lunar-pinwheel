import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathNodeView = (props: NodeViewProps) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const { latex } = props.node.attrs;

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(latex || '?', containerRef.current, {
                    throwOnError: false,
                    displayMode: false,
                });
            } catch (e) {
                console.error('KaTeX rendering error:', e);
            }
        }
    }, [latex]);

    return (
        <NodeViewWrapper
            as="span"
            className={`inline-block mx-1 px-1 rounded transition-all cursor-pointer hover:bg-primary/10 border border-transparent hover:border-primary/20 bg-slate-100 dark:bg-slate-800 align-middle ${props.selected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                }`}
            data-latex={latex}
        >
            <span ref={containerRef} className="katex-rendered-inline" />
        </NodeViewWrapper>
    );
};

export default MathNodeView;
