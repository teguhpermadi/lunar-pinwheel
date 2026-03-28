import React from 'react';
import { cn } from '@/lib/utils';

interface PublishToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    loading?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    activeColor?: string;
    inactiveColor?: string;
    title?: string;
    className?: string;
    label?: string;
}

const sizeClasses = {
    sm: {
        container: 'h-5 w-8',
        thumb: 'h-3.5 w-3.5',
        translate: 'translate-x-3.5',
        translateOff: 'translate-x-0.5',
    },
    md: {
        container: 'h-6 w-10',
        thumb: 'h-4 w-4',
        translate: 'translate-x-5',
        translateOff: 'translate-x-1',
    },
    lg: {
        container: 'h-7 w-12',
        thumb: 'h-5 w-5',
        translate: 'translate-x-6',
        translateOff: 'translate-x-1',
    },
};

export const PublishToggle = React.forwardRef<HTMLButtonElement, PublishToggleProps>(({
    checked,
    onChange,
    loading = false,
    disabled = false,
    size = 'md',
    activeColor = 'bg-purple-500',
    inactiveColor = 'bg-slate-300 dark:bg-slate-600',
    title,
    className = '',
    label,
}, ref) => {
    const sizes = sizeClasses[size];

    const handleClick = () => {
        if (!loading && !disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            title={title}
            disabled={disabled || loading}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn(
                'relative inline-flex items-center rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                checked ? activeColor : inactiveColor,
                sizes.container,
                (disabled || loading) && 'opacity-70 cursor-not-allowed',
                className
            )}
        >
            {loading ? (
                <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className={cn('animate-spin text-white', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </span>
            ) : (
                <span
                    className={cn(
                        'flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-out',
                        sizes.thumb,
                        checked ? sizes.translate : sizes.translateOff,
                        checked && 'shadow-lg'
                    )}
                />
            )}
        </button>
    );
});

PublishToggle.displayName = 'PublishToggle';
