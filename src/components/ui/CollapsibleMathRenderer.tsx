import { useState, useRef, useEffect } from 'react';
import MathRenderer from './MathRenderer';

interface CollapsibleMathRendererProps {
    content: string;
    className?: string;
    maxLines?: number;
}

export default function CollapsibleMathRenderer({ content, className = '', maxLines = 3 }: CollapsibleMathRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current) return;

        const checkOverflow = () => {
            const el = contentRef.current;
            if (el) {
                // If it's not expanded, check if scrollHeight > clientHeight
                if (!isExpanded) {
                    setIsTruncated(el.scrollHeight > el.clientHeight);
                }
            }
        };

        checkOverflow();

        const timeout = setTimeout(checkOverflow, 500);

        const observer = new ResizeObserver(() => checkOverflow());
        observer.observe(contentRef.current);

        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [content, maxLines, isExpanded]);

    const wrapperStyle = !isExpanded ? {
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
    } : {};

    return (
        <div className="flex flex-col w-full h-full justify-center">
            <div
                ref={contentRef}
                className={className}
                style={wrapperStyle}
            >
                <MathRenderer content={content} />
            </div>
            {(isTruncated || isExpanded) && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-[10px] text-primary font-medium mt-1 md:mt-2 self-center hover:underline bg-primary/5 px-2.5 py-1 rounded-full shrink-0 z-10 relative"
                >
                    {isExpanded ? 'Lebih Sedikit' : 'Selengkapnya'}
                </button>
            )}
        </div>
    );
}
