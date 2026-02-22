import { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
    content: string;
    isHtml?: boolean;
    className?: string;
}

export default function MathRenderer({ content, isHtml = true, className = "" }: MathRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            try {
                // @ts-ignore
                if (window.renderMathInElement) {
                    // @ts-ignore
                    window.renderMathInElement(containerRef.current, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false }
                        ],
                        throwOnError: false
                    });
                } else {
                    renderMathInElement(containerRef.current, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true },
                        ],
                        throwOnError: false,
                        output: 'html',
                    });
                }
            } catch (err) {
                // Silently fail if KaTeX fails to render
            }
        }
    }, [content]);

    if (isHtml) {
        return (
            <div
                ref={containerRef}
                className={`math-rendered ${className}`}
                data-content-hash={content.length}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={`math-rendered ${className}`}
            data-content-hash={content.length}
        >
            {content}
        </div>
    );
}
