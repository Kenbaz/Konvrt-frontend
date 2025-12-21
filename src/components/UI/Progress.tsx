import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> { 
    value: number;
    max?: number;
    variant?: ProgressVariant;
    size?: ProgressSize;
    showLabel?: boolean;
    label?: string;
    striped?: boolean;
    animated?: boolean;
    indeterminate?: boolean;
};


const trackStyles = "w-full bg-gray-200 rounded-full overflow-hidden";

const barBaseStyles = "h-full rounded-full transition-all";

const variantStyles: Record<ProgressVariant, string> = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  info: "bg-cyan-600",
};

const sizeStyles: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const labelSizeStyles: Record<ProgressSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};


export function Progress({
  value,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
  indeterminate = false,
  animated = false,
  striped = false,
  className,
  ...props
}: ProgressProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayPercentage = Math.round(percentage);

  // Label text
  const labelText = label ?? `${displayPercentage}%`;

  return (
    <div className={clsx("w-full", className)} {...props}>
      {/* Label */}
      {showLabel && (
        <div
          className={clsx("flex justify-between mb-1", labelSizeStyles[size])}
        >
          <span className="text-gray-700 font-medium">Progress</span>
          <span className="text-gray-500">{labelText}</span>
        </div>
      )}

      {/* Track */}
      <div
        className={clsx(trackStyles, sizeStyles[size])}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : displayPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={labelText}
      >
        {/* Bar */}
        <div
          className={clsx(
            barBaseStyles,
            variantStyles[variant],
            animated && !indeterminate && "duration-500",
            striped && "bg-stripes",
            striped && animated && "animate-stripes",
            indeterminate && "animate-progress-indeterminate w-1/3"
          )}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    size?: number;
    strokeWidth?: number;
    variant?: ProgressVariant;
    showLabel?: boolean;
    label?: string;
    // show indeterminate animation
    indeterminate?: boolean;
};

const circularVariantStyles: Record<ProgressVariant, string> = {
  default: "text-blue-600",
  success: "text-green-600",
  warning: "text-amber-500",
  danger: "text-red-600",
  info: "text-cyan-600",
};


export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  showLabel = false,
  label,
  indeterminate = false,
  className,
  ...props
}: CircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const labelText = label ?? `${Math.round(percentage)}%`;

  return (
    <div
      className={clsx("relative inline-flex", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <svg
        className={clsx(
          "transform -rotate-90",
          indeterminate && "animate-spin"
        )}
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={clsx(
            circularVariantStyles[variant],
            "transition-all duration-300"
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      {/* Center label */}
      {showLabel && !indeterminate && (
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "text-xs font-medium text-gray-700"
          )}
        >
          {labelText}
        </span>
      )}
    </div>
  );
};

