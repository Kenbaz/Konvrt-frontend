import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { clsx } from "clsx";
import { ChevronDown, AlertCircle } from "lucide-react";


export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
};

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> { 
    label?: string;
    helperText?: string;
    error?: string;
    size?: SelectSize;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
};


const baseSelectStyles = clsx(
  "block w-full rounded-lg border",
  "bg-white text-gray-900",
  "appearance-none cursor-pointer",
  "transition-colors duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
);

const selectStateStyles = {
  default: clsx(
    "border-gray-300",
    "hover:border-gray-400",
    "focus:border-blue-500 focus:ring-blue-500"
  ),
  error: clsx(
    "border-red-500",
    "hover:border-red-600",
    "focus:border-red-500 focus:ring-red-500"
  ),
};

const selectSizeStyles: Record<SelectSize, string> = {
  sm: "px-3 py-1.5 pr-9 text-sm",
  md: "px-3 py-2 pr-10 text-sm",
  lg: "px-4 py-3 pr-11 text-base",
};

const iconSizeStyles: Record<SelectSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
};

const iconPositionStyles: Record<SelectSize, string> = {
  sm: "right-3",
  md: "right-3",
  lg: "right-4",
};


export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      placeholder,
      options,
      fullWidth = true,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = Boolean(error);
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    return (
      <div className={clsx(fullWidth ? "w-full" : "inline-block", className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={id}
            className={clsx(
              baseSelectStyles,
              hasError ? selectStateStyles.error : selectStateStyles.default,
              selectSizeStyles[size]
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Icons */}
          <div
            className={clsx(
              "absolute inset-y-0 flex items-center pointer-events-none gap-1",
              iconPositionStyles[size]
            )}
          >
            {hasError && (
              <AlertCircle
                className={clsx(iconSizeStyles[size], "text-red-500")}
              />
            )}
            <ChevronDown
              className={clsx(
                iconSizeStyles[size],
                hasError ? "text-red-500" : "text-gray-400"
              )}
            />
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Helper text (only shown if no error) */}
        {helperText && !hasError && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";