import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from "@radix-ui/react-slot";

// Using cva or manually handling variants. Given the previous file content, it was manual.
// However, standardshadcn uses cva. Let's stick to the manual implementation found in the file
// but extend it to support the new variants.
// Wait, the error message showed `src/components/ui/button.tsx`.
// Let's make it robust.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | 'game' | 'danger' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    fullWidth?: boolean;
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    className = '',
    asChild = false,
    ...props
}, ref) => {
    const Comp = asChild ? Slot : "button";

    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        game: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-transform duration-200 border-none",
        danger: "bg-red-500 text-white hover:bg-red-600",
        link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <Comp
            className={cn(baseStyles, variants[variant], sizes[size], widthClass, className)}
            ref={ref}
            {...props}
        >
            {children}
        </Comp>
    );
});
Button.displayName = "Button";
