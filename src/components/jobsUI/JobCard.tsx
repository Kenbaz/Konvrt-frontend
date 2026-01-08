"use client";

import { memo, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileVideo,
  FileImage,
  FileAudio,
  File,
  Trash2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Card } from "../UI/Card";
import { Badge } from "../UI/Badge";
import { Button } from "../UI/Button";
import { Progress } from "../UI/Progress";
import { DownloadButton } from "../jobsUI/DownloadButton";
import type { JobListItem, Job } from "@/types";
import { useRouter } from "next/navigation";
import {
  OperationStatus,
  isActiveStatus,
  isFinalStatus,
} from "@/types/common-types";
import { formatDistanceToNow, format } from "date-fns";

// Status configuration with colors and icons
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "pending"
      | "processing"
      | "success"
      | "danger"
      | "warning";
    icon: React.ComponentType<{ className?: string }>;
    animate?: boolean;
  }
> = {
  [OperationStatus.PENDING]: {
    label: "Pending",
    variant: "pending",
    icon: Clock,
    animate: false,
  },
  [OperationStatus.QUEUED]: {
    label: "Queued",
    variant: "pending",
    icon: Clock,
    animate: true,
  },
  [OperationStatus.PROCESSING]: {
    label: "Processing",
    variant: "processing",
    icon: Loader2,
    animate: true,
  },
  [OperationStatus.COMPLETED]: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle2,
    animate: false,
  },
  [OperationStatus.FAILED]: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
    animate: false,
  },
};

interface OperationIconProps {
  operationName: string;
  className?: string;
}

function OperationIcon({ operationName, className = "" }: OperationIconProps) {
  const lowerName = operationName.toLowerCase();

  if (
    lowerName.includes("video") ||
    lowerName.includes("compress") ||
    lowerName.includes("convert_video")
  ) {
    return <FileVideo className={className} />;
  }
  if (
    lowerName.includes("image") ||
    lowerName.includes("resize") ||
    lowerName.includes("convert_image")
  ) {
    return <FileImage className={className} />;
  }
  if (
    lowerName.includes("audio") ||
    lowerName.includes("extract_audio") ||
    lowerName.includes("convert_audio")
  ) {
    return <FileAudio className={className} />;
  }
  return <File className={className} />;
}

// Format operation name for display
function formatOperationName(operationName: string): string {
  return operationName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}


function formatJobDate(dateString: string | null): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "-";
  }
}

function formatFullDate(dateString: string | null): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return format(date, "PPpp"); 
  } catch {
    return "-";
  }
}

export interface JobCardProps {
  job: JobListItem | Job;
  detailed?: boolean;
  clickable?: boolean;
  onClick?: (job: JobListItem | Job) => void;
  onDownload?: (job: JobListItem | Job) => void;
  onDelete?: (job: JobListItem | Job) => void;
  onRetry?: (job: JobListItem | Job) => void;
  showActions?: boolean;
  highlighted?: boolean;
  className?: string;
}

function JobCardComponent({
  job,
  detailed = false,
  clickable = true,
  onClick,
  onDelete,
  onRetry,
  showActions = true,
  highlighted = false,
  className = "",
}: JobCardProps) {
  const router = useRouter();
  const statusConfig =
    STATUS_CONFIG[job.status] ?? STATUS_CONFIG[OperationStatus.PENDING];
  const StatusIcon = statusConfig.icon;

  const isActive = isActiveStatus(job.status);
  const isFinal = isFinalStatus(job.status);
  const canDownload =
    job.status === OperationStatus.COMPLETED &&
    (("has_output" in job && job.has_output) ||
      ("output_file" in job && job.output_file !== null));
  const canRetry = job.status === OperationStatus.FAILED;
  const canDelete = "can_be_deleted" in job ? job.can_be_deleted : isFinal;

  // Memoize date formatting
  const createdAt = useMemo(
    () => formatJobDate(job.created_at),
    [job.created_at]
  );
  const completedAt = useMemo(
    () => ("completed_at" in job ? formatJobDate(job.completed_at) : null),
    [job]
  );
  const fullCreatedDate = useMemo(
    () => formatFullDate(job.created_at),
    [job.created_at]
  );

  const handleCardClick = () => {
    if (clickable && onClick) {
      onClick(job);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(job);
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry?.(job);
  };

  const handleViewDetails = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/jobs/${job.id}`);
    },
    [router, job.id]
  );

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-200
        ${
          clickable && onClick
            ? "cursor-pointer hover:shadow-md hover:border-primary/30"
            : ""
        }
        ${highlighted ? "ring-2 ring-primary ring-offset-2" : ""}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Progress indicator for active jobs */}
      {isActive && job.progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <Progress value={job.progress} className="h-full rounded-none" />
        </div>
      )}

      <div className="md:p-4">
        {/* Header: Operation name and status */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0 p-2 border bg-muted rounded-lg">
              <OperationIcon
                operationName={job.operation}
                className="h-5 w-5 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-400 text-sm md:text-base truncate">
                {formatOperationName(job.operation)}
              </h3>
              <p
                className="text-xs text-gray-300 truncate"
                title={fullCreatedDate}
              >
                {createdAt}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <Badge variant={statusConfig.variant} className="shrink-0">
            <StatusIcon
              className={`h-3 w-3 mr-1 ${
                statusConfig.animate ? "animate-spin" : ""
              }`}
            />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Progress bar for processing jobs */}
        {isActive && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {detailed && "input_file" in job && (
          <div className="space-y-2 mb-3 text-sm">
            {job.input_file && (
              <div className="flex items-center justify-between text-gray-300">
                <span>Input</span>
                <span
                  className="truncate max-w-50"
                  title={job.input_file.file_name}
                >
                  {job.input_file.file_name}
                </span>
              </div>
            )}
            {job.output_file && (
              <div className="flex items-center justify-between text-gray-300">
                <span>Output</span>
                <span
                  className="truncate max-w-50"
                  title={job.output_file.file_name}
                >
                  {job.output_file.file_name}
                </span>
              </div>
            )}
            {job.processing_time_formatted && (
              <div className="flex items-center justify-between text-gray-300">
                <span>Processing Time</span>
                <span>{job.processing_time_formatted}</span>
              </div>
            )}
          </div>
        )}

        {completedAt && job.status === OperationStatus.COMPLETED && (
          <p className="text-xs md:text-sm text-gray-300 mb-3">
            Completed {completedAt}
          </p>
        )}

        {job.status === OperationStatus.FAILED &&
          "error_message" in job &&
          job.error_message && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md mb-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive line-clamp-2">
                {job.error_message}
              </p>
            </div>
          )}

        {job.is_expired && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <AlertCircle className="h-3 w-3" />
            <span>Files have expired</span>
          </div>
        )}

        {showActions && (
          <div
            className="flex items-center gap-2 pt-2 border-t border-gray-400"
            onClick={(e) => e.stopPropagation()}
          >
            {canDownload && !job.is_expired && (
              <DownloadButton
                job={job}
                variant="outline"
                size="md"
                showProgress={true}
                className="flex-1 hover:text-gray-800 text-gray-300 cursor-pointer"
              />
            )}

            {canRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryClick}
                className="flex-1 hover:text-gray-800 text-gray-300 cursor-pointer"
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Retry
              </Button>
            )}

            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-muted-foreground cursor-pointer hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {clickable && onClick && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground hover:text-blue-700 cursor-pointer"
                onClick={handleViewDetails}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export const JobCard = memo(JobCardComponent);

export interface JobStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  className?: string;
}

export function JobStatusBadge({
  status,
  showIcon = true,
  className = "",
}: JobStatusBadgeProps) {
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[OperationStatus.PENDING];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && (
        <Icon
          className={`h-3 w-3 mr-1 ${config.animate ? "animate-spin" : ""}`}
        />
      )}
      {config.label}
    </Badge>
  );
}

// Compact job card for use in lists or sidebars
export interface CompactJobCardProps {
  job: JobListItem;
  onClick?: (job: JobListItem) => void;
  className?: string;
}

export function CompactJobCard({
  job,
  onClick,
  className = "",
}: CompactJobCardProps) {
  const statusConfig =
    STATUS_CONFIG[job.status] ?? STATUS_CONFIG[OperationStatus.PENDING];
  const StatusIcon = statusConfig.icon;
  const isActive = isActiveStatus(job.status);

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-card
        ${onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
        ${className}
      `}
      onClick={() => onClick?.(job)}
    >
      <div className="shrink-0 p-1.5 bg-muted rounded">
        <OperationIcon
          operationName={job.operation}
          className="h-5 w-5 text-muted-foreground"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {formatOperationName(job.operation)}
        </p>
        {isActive && <Progress value={job.progress} className="h-1 mt-1" />}
      </div>

      <StatusIcon
        className={`
          h-4 w-4 shrink-0
          ${statusConfig.variant === "success" ? "text-green-600" : ""}
          ${statusConfig.variant === "danger" ? "text-red-600" : ""}
          ${statusConfig.variant === "processing" ? "text-blue-600" : ""}
          ${statusConfig.variant === "pending" ? "text-amber-600" : ""}
          ${statusConfig.animate ? "animate-spin" : ""}
        `}
      />
    </div>
  );
};