import { useEffect, useRef, useMemo } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import * as DOMPurify from 'dompurify';
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

    // Sanitize processedContent when running in the browser to prevent XSS
    const safeContent = useMemo(() => {
        if (!processedContent) return '';
        try {
            if (typeof window !== 'undefined' && DOMPurify) {
                // Cast to any to avoid depending on DOMPurify types in this repo
                return (DOMPurify as any).sanitize(processedContent);
            }
        } catch (err) {
            // If sanitization fails for any reason, fall back to the raw processedContent
            return processedContent;
        }
        return processedContent;
    }, [processedContent]);

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
    }, [safeContent]);

    if (isHtml) {
        return (
            <div
                ref={containerRef}
                className={`math-rendered prose prose-slate dark:prose-invert max-w-none ${className}`}
                data-content-hash={safeContent.length}
                dangerouslySetInnerHTML={{ __html: safeContent }}
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
