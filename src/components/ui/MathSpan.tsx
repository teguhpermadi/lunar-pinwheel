import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathSpanProps {
    content: string;
    displayMode?: boolean;
    className?: string;
}

export default function MathSpan({ content, displayMode = false, className = "" }: MathSpanProps) {
    const spanRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (spanRef.current && content) {
            try {
                katex.render(content, spanRef.current, {
                    displayMode,
                    throwOnError: false
                });
            } catch (err) {
                console.error('KaTeX rendering error:', err);
                if (spanRef.current) {
                    spanRef.current.textContent = content;
                }
            }
        }
    }, [content, displayMode]);

    return (
        <span
            ref={spanRef}
            className={`math-span ${className}`}
        >
            {content}
        </span>
    );
}
