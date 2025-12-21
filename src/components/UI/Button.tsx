import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";


export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
};


const baseStyles = clsx(
  "inline-flex items-center justify-center",
  "font-medium rounded-lg",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-2",
  "disabled:opacity-50 disabled:cursor-not-allowed"
);


const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    "bg-blue-600 text-white",
    "hover:bg-blue-700",
    "focus:ring-blue-500",
    "active:bg-blue-800"
  ),
  secondary: clsx(
    "bg-gray-100 text-gray-900",
    "hover:bg-gray-200",
    "focus:ring-gray-500",
    "active:bg-gray-300"
  ),
  outline: clsx(
    "border-2 border-gray-300 bg-transparent text-gray-700",
    "hover:bg-gray-50 hover:border-gray-400",
    "focus:ring-gray-500",
    "active:bg-gray-100"
  ),
  ghost: clsx(
    "bg-transparent text-gray-700",
    "hover:bg-gray-100",
    "focus:ring-gray-500",
    "active:bg-gray-200"
  ),
  danger: clsx(
    "bg-red-600 text-white",
    "hover:bg-red-700",
    "focus:ring-red-500",
    "active:bg-red-800"
  ),
};


const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};


export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* Loading spinner or left icon */}
        {isLoading ? (
          <Loader2 className={clsx(iconSizeStyles[size], "animate-spin")} />
        ) : leftIcon ? (
          <span className={iconSizeStyles[size]}>{leftIcon}</span>
        ) : null}

        {/* Button text */}
        <span>{isLoading && loadingText ? loadingText : children}</span>

        {/* Right icon (hidden when loading) */}
        {!isLoading && rightIcon && (
          <span className={iconSizeStyles[size]}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";