import React, { InputHTMLAttributes } from 'react';
import { UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    registration?: Partial<UseFormRegisterReturn>;
}


const defaultClasses = {
    root: 'w-6 h-6 mr-2 border border-neutral-300 rounded',
    error: 'border-danger focus:ring-danger',
    disabled: 'cursor-not-allowed opacity-50 bg-neutral-100',
};

const Checkbox = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, registration, name, error, disabled, ...rest }, ref) => {
        // Combine classes using twMerge
        const rootClasses = twMerge(
            defaultClasses.root,
            error && defaultClasses.error,
            disabled && defaultClasses.disabled,
            className // Custom classes will override defaults
        );

        return (
            <div className="flex items-center justify-start">
                <input
                    id={name}
                    name={name}
                    type="checkbox"
                    ref={ref}
                    disabled={disabled}
                    className={rootClasses}
                    {...registration}
                    {...rest}
                />
                {error && (
                    <p className="text-danger text-s mt-xs">{error}</p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;