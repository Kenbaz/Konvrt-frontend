// src/components/jobsUI/JobProgress.tsx
"use client";

import { memo, useMemo } from "react";
import { Clock, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Progress } from "@/components/UI/Progress";
import { useJobPolling } from "@/lib/hooks/useJobPolling";
import type { JobStatus } from "@/types";
import { OperationStatus } from "@/types/common-types";


export interface JobProgressProps {
  jobId: string;
  pollingInterval?: number;
  showEta?: boolean;
  showPercentage?: boolean;
  showStatus?: boolean;
  size?: "sm" | "md" | "lg";
  onComplete?: (status: JobStatus) => void;
  onError?: (status: JobStatus) => void;
  onProgress?: (progress: number, eta: number | null) => void;
  className?: string;
}

/**
 * Progress bar heights for different sizes
 */
const SIZE_CONFIG = {
  sm: {
    barHeight: "h-1.5",
    textSize: "text-xs",
    iconSize: "h-3 w-3",
    spacing: "gap-1",
  },
  md: {
    barHeight: "h-2",
    textSize: "text-sm",
    iconSize: "h-4 w-4",
    spacing: "gap-2",
  },
  lg: {
    barHeight: "h-3",
    textSize: "text-base",
    iconSize: "h-5 w-5",
    spacing: "gap-3",
  },
} as const;


const STATUS_DISPLAY = {
  [OperationStatus.PENDING]: {
    label: "Waiting to start",
    icon: Clock,
    color: "text-amber-600",
  },
  [OperationStatus.QUEUED]: {
    label: "In queue",
    icon: Clock,
    color: "text-amber-600",
  },
  [OperationStatus.PROCESSING]: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-600",
    animate: true,
  },
  [OperationStatus.COMPLETED]: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  [OperationStatus.FAILED]: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-600",
  },
} as const;


function JobProgressComponent({
  jobId,
  pollingInterval = 2000,
  showEta = true,
  showPercentage = true,
  showStatus = true,
  size = "md",
  onComplete,
  onError,
  onProgress,
  className = "",
}: JobProgressProps) {
  const {
    status,
    progress,
    etaFormatted,
    isActive,
    isComplete,
    isSuccess,
    isPolling,
  } = useJobPolling(jobId, {
    interval: pollingInterval,
    onComplete,
    onError,
    onProgress,
  });

  const sizeConfig = SIZE_CONFIG[size];
  const currentStatus = status?.status ?? OperationStatus.PENDING;
  const statusConfig = STATUS_DISPLAY[currentStatus] ?? STATUS_DISPLAY[OperationStatus.PENDING];
  const StatusIcon = statusConfig.icon;


  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status and ETA row */}
      {(showStatus || showEta) && (
        <div className={`flex items-center justify-between ${sizeConfig.textSize}`}>
          {showStatus && (
            <div className={`flex items-center ${sizeConfig.spacing} ${statusConfig.color}`}>
              <StatusIcon
                className={`${sizeConfig.iconSize} ${'animate' in statusConfig && statusConfig.animate ? "animate-spin" : ""}`}
              />
              <span className="font-medium">{statusConfig.label}</span>
            </div>
          )}

          {showEta && etaFormatted && isActive && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap className={sizeConfig.iconSize} />
              <span>~{etaFormatted} remaining</span>
            </div>
          )}

          {showPercentage && !showEta && (
            <span className="text-muted-foreground font-mono">{progress}%</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative">
        <Progress
          value={progress}
          className={`${sizeConfig.barHeight} transition-all duration-300`}
        />
        
        {/* Animated pulse overlay for active jobs */}
        {isPolling && isActive && progress > 0 && progress < 100 && (
          <div
            className={`absolute top-0 left-0 ${sizeConfig.barHeight} bg-white/30 animate-pulse rounded-full`}
            style={{ width: `${progress}%` }}
          />
        )}
      </div>

      {showPercentage && showEta && (
        <div className={`flex justify-between ${sizeConfig.textSize} text-muted-foreground`}>
          <span>{progress}% complete</span>
          {isComplete && (
            <span className={isSuccess ? "text-green-600" : "text-red-600"}>
              {isSuccess ? "Done!" : "Failed"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const JobProgress = memo(JobProgressComponent);

/**
 * Minimal progress bar without status text - just the bar
 */
export interface MinimalProgressBarProps {
  progress: number;
  isActive?: boolean;
  isSuccess?: boolean;
  isFailed?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MinimalProgressBar({
  progress,
  isActive = false,
  isSuccess = false,
  isFailed = false,
  size = "md",
  showLabel = false,
  className = "",
}: MinimalProgressBarProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const colorClass = useMemo(() => {
    if (isFailed) return "[&>div]:bg-red-500";
    if (isSuccess) return "[&>div]:bg-green-500";
    if (isActive) return "[&>div]:bg-blue-500";
    return "[&>div]:bg-amber-500";
  }, [isFailed, isSuccess, isActive]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Progress
        value={progress}
        className={`flex-1 ${sizeConfig.barHeight} ${colorClass}`}
      />
      {showLabel && (
        <span className={`${sizeConfig.textSize} text-muted-foreground font-mono min-w-[3ch]`}>
          {progress}%
        </span>
      )}
    </div>
  );
}

/**
 * Circular progress indicator for compact displays
 */
export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isActive?: boolean;
  isSuccess?: boolean;
  isFailed?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  isActive = false,
  isSuccess = false,
  isFailed = false,
  showPercentage = true,
  className = "",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const strokeColor = useMemo(() => {
    if (isFailed) return "stroke-red-500";
    if (isSuccess) return "stroke-green-500";
    if (isActive) return "stroke-blue-500";
    return "stroke-amber-500";
  }, [isFailed, isSuccess, isActive]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${strokeColor} transition-all duration-300`}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium">
          {progress}%
        </span>
      )}
    </div>
  );
}

/**
 * Progress with steps indicator - for multi-phase operations
 */
export interface SteppedProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  isActive?: boolean;
  className?: string;
}

export function SteppedProgress({
  currentStep,
  totalSteps,
  isActive = false,
  className = "",
}: SteppedProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex items-center">
            {/* Step indicator */}
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                transition-all duration-200
                ${isCompleted ? "bg-green-500 border-green-500 text-white" : ""}
                ${isCurrent ? "border-blue-500 text-blue-500" : ""}
                ${!isCompleted && !isCurrent ? "border-muted text-muted-foreground" : ""}
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isCurrent && isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                step + 1
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`
                  w-12 h-0.5 mx-1
                  ${isCompleted ? "bg-green-500" : "bg-muted"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};