import React from 'react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    register?: UseFormRegisterReturn;
    error?: FieldError;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, register, error, icon, className, ...props }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor={props.id}>
                {label}
            </label>
            <div className="relative rounded-md shadow-sm">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    {...register}
                    {...props}
                    className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded-lg focus:ring-primary focus:border-primary dark:bg-surface-dark dark:text-white sm:text-sm transition-all duration-200 ${error
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-slate-300 dark:border-slate-600'
                        } ${className}`}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
        </div>
    );
};
