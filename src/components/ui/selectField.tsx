import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from 'tailwind-merge';

interface Option {
    _id: string | number;
    name: string;
    [key: string]: any;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    registration?: Partial<UseFormRegisterReturn>;
    options?: Option[];
    placeholder?: string;
    className?: string;
    selectClassName?: string;
    disabled?: boolean;
    showLabel?: boolean;
    variant?: 'normal'; // | 'solid' | 'outline';
    dimension?: 'small'; // | 'medium' | 'big';
    isDependent?: boolean;
    dependentValue?: string | number;
    readOnly?: boolean;
    required?: boolean;
    inputBgColor?: string;
}

const baseClasses = {
    root: '',
    label: 'block text-sm font-medium text-neutral-1200 mb-1',
    select: 'block w-full rounded-lg border focus:outline-none transition-colors duration-200 hover:border-[#57cc99]',
    error: 'text-danger text-sm mt-1',
    disabled: 'bg-gray-100 text-gray-700 cursor-not-allowed',
};

const variantClasses = {
    normal: 'border-[#dddddd]] hover:border-primary focus:border-primary'
    /*solid: 'bg-neutral-100 border-neutral-300 hover:border-primary focus:border-primary',
    outline: 'bg-white border-primary hover:border-tertiary focus:border-tertiary'*/
};

const dimensionClasses = {
    small: 'h-10 px-3 py-2 text-sm',
    //medium: 'h-12 px-4 py-3 text-base'
    // big: 'h-14 px-5 py-4 text-lg'
};

const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            className,
            selectClassName,
            label,
            error,
            options = [],
            placeholder = 'Select an option',
            registration,
            disabled,
            variant = 'normal',
            dimension = 'small',
            isDependent = false,
            readOnly = false,
            required = false,
            dependentValue,
            inputBgColor,
            ...rest
        },
        ref
    ) => {
        // Check if the select should be disabled
        const isDisabled = disabled || (isDependent && !dependentValue);

        // Determine background color
        const backgroundColor = readOnly
            ? 'bg-gray-100'
            : isDisabled
                ? 'bg-gray-100'
                : inputBgColor || 'bg-white';

        // Combine classes for the select element
        const selectClasses = twMerge(
            baseClasses.select,
            variantClasses[variant],
            dimensionClasses[dimension],
            isDisabled ? baseClasses.disabled : '',
            backgroundColor,
            error ? 'border-danger focus:border-danger' : '',
            !rest.value && 'text-black',
            readOnly? 'pointer-events-none text-gray-700' : '',
            selectClassName
        );

        return (
            <div className={twMerge(
                baseClasses.root,
                isDependent && !dependentValue && 'pointer-events-none',
                className
            )}>
                {label && (
                    <label className={baseClasses.label}>
                        {label} {required && <span className="text-negativeBold">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    className={selectClasses}
                    disabled={isDisabled}
                    aria-disabled={readOnly}
                    {...registration}
                    {...rest}
                >
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option key={option._id} value={option._id}>
                            {option.name}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className={baseClasses.error}>{error}</p>
                )}
            </div>
        );
    }
);

SelectField.displayName = 'Select';

export default SelectField;