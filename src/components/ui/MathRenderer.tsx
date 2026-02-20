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
        console.log("MathRenderer: Rendering content", { content, isHtml });
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
                console.log("MathRenderer: KaTeX auto-render called successfully");
            } catch (err) {
                console.error("MathRenderer: KaTeX auto-render failed:", err);
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
