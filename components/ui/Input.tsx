'use client';

import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      containerClassName = '',
      className = '',
      id: externalId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[#111827]"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <span className="absolute left-3 flex items-center text-[#6B7280] pointer-events-none">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={[
              'w-full h-12 rounded-lg border bg-white text-[#111827] placeholder-[#6B7280]',
              'text-base transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              error
                ? 'border-[#EF4444] focus:ring-[#EF4444]'
                : 'border-[#E5E7EB] hover:border-gray-300',
              prefixIcon ? 'pl-10' : 'pl-3',
              suffixIcon ? 'pr-10' : 'pr-3',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {suffixIcon && (
            <span className="absolute right-3 flex items-center text-[#6B7280]">
              {suffixIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-[#EF4444] flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-[#6B7280]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
