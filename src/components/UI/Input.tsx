import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { clsx } from "clsx";
import { AlertCircle } from "lucide-react";


export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> { 
    label?: string;
    helperText?: string;
    error?: string;
    size?: InputSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
};


const baseInputStyles = clsx(
  "block w-full rounded-lg border",
  "bg-white text-gray-900",
  "placeholder:text-gray-400",
  "transition-colors duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
);

const inputStateStyles = {
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

const inputSizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

const inputWithIconStyles = {
  left: {
    sm: "pl-9",
    md: "pl-10",
    lg: "pl-11",
  },
  right: {
    sm: "pr-9",
    md: "pr-10",
    lg: "pr-11",
  },
};

const iconSizeStyles: Record<InputSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
};

const iconPositionStyles = {
  left: {
    sm: "left-3",
    md: "left-3",
    lg: "left-4",
  },
  right: {
    sm: "right-3",
    md: "right-3",
    lg: "right-4",
  },
};


export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      leftIcon,
      rightIcon,
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

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={clsx(
                "absolute inset-y-0 flex items-center pointer-events-none",
                iconPositionStyles.left[size],
                hasError ? "text-red-500" : "text-gray-400"
              )}
            >
              <span className={iconSizeStyles[size]}>{leftIcon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            className={clsx(
              baseInputStyles,
              hasError ? inputStateStyles.error : inputStateStyles.default,
              inputSizeStyles[size],
              leftIcon && inputWithIconStyles.left[size],
              (rightIcon || hasError) && inputWithIconStyles.right[size]
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />

          {/* Right icon or error icon */}
          {(rightIcon || hasError) && (
            <div
              className={clsx(
                "absolute inset-y-0 flex items-center pointer-events-none",
                iconPositionStyles.right[size],
                hasError ? "text-red-500" : "text-gray-400"
              )}
            >
              {hasError ? (
                <AlertCircle className={iconSizeStyles[size]} />
              ) : (
                <span className={iconSizeStyles[size]}>{rightIcon}</span>
              )}
            </div>
          )}
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

Input.displayName = "Input";