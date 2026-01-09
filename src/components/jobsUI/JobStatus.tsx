"use client";

import { memo } from "react";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hourglass,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/UI/Badge";
import { useJobPolling } from "@/lib/hooks/useJobPolling";
import type { JobStatus as JobStatusType } from "@/types";
import { OperationStatus } from "@/types/common-types";

/**
 * Status configuration with display properties
 */
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "pending" | "processing" | "success" | "danger" | "warning" | "default";
    animate?: boolean;
    color: string;
    bgColor: string;
  }
> = {
  [OperationStatus.PENDING]: {
    label: "Pending",
    description: "Job is waiting to be queued",
    icon: Hourglass,
    variant: "pending",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  [OperationStatus.QUEUED]: {
    label: "Queued",
    description: "Job is in the processing queue",
    icon: Clock,
    variant: "pending",
    animate: true,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  [OperationStatus.PROCESSING]: {
    label: "Processing",
    description: "Job is being processed",
    icon: Loader2,
    variant: "processing",
    animate: true,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  [OperationStatus.COMPLETED]: {
    label: "Completed",
    description: "Job finished successfully",
    icon: CheckCircle2,
    variant: "success",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  [OperationStatus.FAILED]: {
    label: "Failed",
    description: "Job encountered an error",
    icon: XCircle,
    variant: "danger",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};


export interface JobStatusDisplayProps {
  status: string;
  showIcon?: boolean;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "inline" | "card";
  className?: string;
}

/**
 * Static status display component - shows current status without polling
 */
function JobStatusDisplayComponent({
  status,
  showIcon = true,
  showDescription = false,
  size = "md",
  variant = "badge",
  className = "",
}: JobStatusDisplayProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[OperationStatus.PENDING];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs", badge: "px-2 py-0.5" },
    md: { icon: "h-4 w-4", text: "text-sm", badge: "px-2.5 py-1" },
    lg: { icon: "h-5 w-5", text: "text-base", badge: "px-3 py-1.5" },
  };

  const sizes = sizeClasses[size];

  if (variant === "badge") {
    return (
      <Badge variant={config.variant} className={`${sizes.badge} ${className}`}>
        {showIcon && (
          <Icon
            className={`${sizes.icon} mr-1.5 ${config.animate ? "animate-spin" : ""}`}
          />
        )}
        <span className={sizes.text}>{config.label}</span>
      </Badge>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${config.color} ${className}`}>
        {showIcon && (
          <Icon className={`${sizes.icon} ${config.animate ? "animate-spin" : ""}`} />
        )}
        <span className={`${sizes.text} font-medium`}>{config.label}</span>
        {showDescription && (
          <span className={`${sizes.text} text-muted-foreground ml-1`}>
            - {config.description}
          </span>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor} ${className}`}>
      <div className={`p-2 rounded-full bg-white/50`}>
        <Icon className={`${sizes.icon} ${config.color} ${config.animate ? "animate-spin" : ""}`} />
      </div>
      <div>
        <p className={`${sizes.text} font-medium ${config.color}`}>{config.label}</p>
        {showDescription && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    </div>
  );
}

export const JobStatusDisplay = memo(JobStatusDisplayComponent);


export interface JobStatusLiveProps {
  jobId: string;
  pollingInterval?: number;
  showProgress?: boolean;
  showEta?: boolean;
  showError?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "inline" | "card" | "detailed";
  onStatusChange?: (status: JobStatusType) => void;
  onComplete?: (status: JobStatusType) => void;
  className?: string;
};

/**
 * Live status component that polls for updates
 */
function JobStatusLiveComponent({
  jobId,
  pollingInterval = 2000,
  showProgress = true,
  showEta = true,
  showError = true,
  size = "md",
  variant = "detailed",
  onStatusChange,
  onComplete,
  className = "",
}: JobStatusLiveProps) {
  const {
    status,
    progress,
    etaFormatted,
    isActive,
    isSuccess,
    isFailed,
    errorMessage,
  } = useJobPolling(jobId, {
    interval: pollingInterval,
    onStatusChange,
    onComplete,
  });

  const currentStatus = status?.status ?? OperationStatus.PENDING;
  const config = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG[OperationStatus.PENDING];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs", heading: "text-sm" },
    md: { icon: "h-4 w-4", text: "text-sm", heading: "text-base" },
    lg: { icon: "h-5 w-5", text: "text-base", heading: "text-lg" },
  };

  const sizes = sizeClasses[size];

  // Simple variants delegate to static display
  if (variant === "badge" || variant === "inline") {
    return (
      <JobStatusDisplay
        status={currentStatus}
        showIcon
        size={size}
        variant={variant}
        className={className}
      />
    );
  }

  // Card variant with progress
  if (variant === "card") {
    return (
      <div className={`p-4 rounded-lg border ${config.bgColor} ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon
            className={`${sizes.icon} ${config.color} ${config.animate ? "animate-spin" : ""}`}
          />
          <span className={`${sizes.heading} font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        {isActive && showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% complete</span>
              {showEta && etaFormatted && <span>~{etaFormatted} remaining</span>}
            </div>
            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.color.replace("text-", "bg-")} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isFailed && showError && errorMessage && (
          <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Detailed variant - full information display
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${config.color}`}>
          <Icon
            className={`${sizes.icon} ${config.animate ? "animate-spin" : ""}`}
          />
          <span className={`${sizes.heading} font-semibold`}>{config.label}</span>
        </div>

        {isActive && showEta && etaFormatted && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Timer className={sizes.icon} />
            <span className={sizes.text}>~{etaFormatted}</span>
          </div>
        )}
      </div>

      {/* Progress section */}
      {isActive && showProgress && (
        <div className="space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`${sizes.text} text-muted-foreground`}>
            {progress}% complete
          </p>
        </div>
      )}

      {/* Description */}
      <p className={`${sizes.text} text-muted-foreground`}>
        {config.description}
      </p>

      {/* Error message */}
      {isFailed && showError && errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Success message */}
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">Processing completed successfully!</p>
        </div>
      )}
    </div>
  );
}

export const JobStatusLive = memo(JobStatusLiveComponent);

/**
 * Status timeline showing transitions
 */
export interface StatusTimelineProps {
  currentStatus: string;
  timestamps?: Partial<Record<string, string>>;
  showTimestamps?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const STATUS_ORDER = [
  OperationStatus.PENDING,
  OperationStatus.QUEUED,
  OperationStatus.PROCESSING,
  OperationStatus.COMPLETED,
  OperationStatus.FAILED,
];

export function StatusTimeline({
  currentStatus,
  timestamps = {},
  showTimestamps = true,
  orientation = "horizontal",
  className = "",
}: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as OperationStatus);
  const isFailed = currentStatus === OperationStatus.FAILED;

  if (orientation === "vertical") {
    return (
      <div className={`space-y-0 ${className}`}>
        {STATUS_ORDER.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STATUS_ORDER.length - 1;

          // If failed, mark processing as failed
          const showAsFailed = isFailed && status === OperationStatus.PROCESSING;

          return (
            <div key={status} className="flex gap-3">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${isPast ? "bg-green-500 border-green-500 text-white" : ""}
                    ${isCurrent && !isFailed ? `${config.bgColor} ${config.color} border-current` : ""}
                    ${showAsFailed ? "bg-red-500 border-red-500 text-white" : ""}
                    ${!isPast && !isCurrent && !showAsFailed ? "border-muted text-muted-foreground" : ""}
                  `}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : showAsFailed ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isCurrent && config.animate ? "animate-spin" : ""}`} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 h-8 ${isPast ? "bg-green-500" : "bg-muted"}`}
                  />
                )}
              </div>

              {/* Label and timestamp */}
              <div className="pb-8">
                <p
                  className={`font-medium ${
                    isPast || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {showAsFailed ? "Failed" : config.label}
                </p>
                {showTimestamps && timestamps[status] && (
                  <p className="text-xs text-muted-foreground">{timestamps[status]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={`flex items-center ${className}`}>
      {STATUS_ORDER.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_ORDER.length - 1;
        const showAsFailed = isFailed && status === OperationStatus.PROCESSING;

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2
                  ${isPast ? "bg-green-500 border-green-500 text-white" : ""}
                  ${isCurrent && !isFailed ? `${config.bgColor} ${config.color} border-current` : ""}
                  ${showAsFailed ? "bg-red-500 border-red-500 text-white" : ""}
                  ${!isPast && !isCurrent && !showAsFailed ? "border-muted text-muted-foreground" : ""}
                `}
              >
                {isPast ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : showAsFailed ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Icon className={`h-4 w-4 ${isCurrent && config.animate ? "animate-spin" : ""}`} />
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isPast || isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {showAsFailed ? "Failed" : config.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`w-12 h-0.5 mx-2 ${isPast ? "bg-green-500" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Export utility function for getting status config
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG[OperationStatus.PENDING];
};