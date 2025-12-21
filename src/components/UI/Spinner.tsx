import { type HTMLAttributes } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'white';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> { 
    size?: SpinnerSize;
    variant?: SpinnerVariant;
    label?: string;
};


const sizeStyles: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const variantStyles: Record<SpinnerVariant, string> = {
  default: "text-gray-500",
  primary: "text-blue-600",
  white: "text-white",
};


export function Spinner({
  size = "md",
  variant = "default",
  label = "Loading...",
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx("inline-flex", className)}
      {...props}
    >
      <Loader2
        className={clsx(
          "animate-spin",
          sizeStyles[size],
          variantStyles[variant]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};


// FullpageSpinner component

export interface FullPageSpinnerProps {
    message?: string;
    size?: SpinnerSize;
};


export function FullPageSpinner({
  message,
  size = "lg",
}: FullPageSpinnerProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <Spinner size={size} variant="primary" />
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
};


// InlineSpinner Component

export interface InlineSpinnerProps { 
    size?: SpinnerSize;
    message?: string;
    className?: string;
};


export function InlineSpinner({
  message,
  size = "sm",
  className,
}: InlineSpinnerProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <Spinner size={size} variant="primary" />
      {message && <span className="text-gray-600">{message}</span>}
    </span>
  );
}