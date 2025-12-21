import { type HTMLAttributes } from "react";
import { clsx } from "clsx";
import type { OperationStatus } from "@/types";


export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
};


const baseStyles = clsx(
  "inline-flex items-center font-medium rounded-full",
  "whitespace-nowrap"
);

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-cyan-100 text-cyan-700",
  // Status-specific variants
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  primary: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-cyan-500",
  pending: "bg-amber-500",
  processing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

const dotSizeStyles: Record<BadgeSize, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2 w-2",
};


export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            "rounded-full mr-1.5",
            dotSizeStyles[size],
            dotStyles[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
};


// Helper functions

// Map OperationStatus to BadgeVariant
export function getStatusVariant(status: OperationStatus): BadgeVariant { 
    const statusMap: Record<OperationStatus, BadgeVariant> = {
        pending: "pending",
        queued: "pending",
        processing: "processing",
        completed: "completed",
        failed: "failed",
    };
    return statusMap[status] || "default";
};

// Get display text for OperationStatus
export function getStatusText(status: OperationStatus): string { 
    const textMap: Record<OperationStatus, string> = {
        pending: "Pending",
        queued: "Queued",
        processing: "Processing",
        completed: "Completed",
        failed: "Failed",
    };
    return textMap[status] || status;
};

// Check if status should show pulse animation
export function shouldPulse(status: OperationStatus): boolean { 
    return status === 'processing' || status === 'queued';
};


// Status badge component

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: OperationStatus;
  showDot?: boolean;
};


export function StatusBadge({
  status,
  showDot = true,
  size = "md",
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant={getStatusVariant(status)}
      size={size}
      dot={showDot}
      pulse={shouldPulse(status)}
      {...props}
    >
      {getStatusText(status)}
    </Badge>
  );
}