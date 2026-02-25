import { useEffect, useRef, useMemo } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
    content: string;
    isHtml?: boolean;
    className?: string;
}

export default function MathRenderer({ content, isHtml = true, className = "" }: MathRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const processedContent = useMemo(() => {
        if (!content) return '';
        let processed = content;

        // Replace [ara]...[/ara] with a styled span
        processed = processed.replace(/\[ara\]([\s\S]*?)\[\/ara\]/g, (_, text) => {
            return `<span class="font-arabic text-xl leading-relaxed inline-block" dir="rtl">${text}</span>`;
        });

        // Replace [jav]...[/jav] with a styled span
        processed = processed.replace(/\[jav\]([\s\S]*?)\[\/jav\]/g, (_, text) => {
            return `<span class="font-javanese text-xl leading-relaxed inline-block">${text}</span>`;
        });

        return processed;
    }, [content]);

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
    }, [processedContent]);

    if (isHtml) {
        return (
            <div
                ref={containerRef}
                className={`math-rendered prose prose-slate dark:prose-invert max-w-none ${className}`}
                data-content-hash={processedContent.length}
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={`math-rendered prose prose-slate dark:prose-invert max-w-none ${className}`}
            data-content-hash={processedContent.length}
        >
            {processedContent}
        </div>
    );
}
