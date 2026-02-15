import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseStyles = "flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "border border-transparent shadow-sm text-white bg-primary hover:bg-primary-dark hover:shadow-lg focus:ring-primary",
        outline: "border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
        ghost: "text-primary hover:text-primary-dark bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${widthClass} ${className} group relative overflow-hidden`}
            {...props}
        >
            {variant === 'primary' && (
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            )}
            {children}
        </button>
    );
};
