// src/app/jobs/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Download,
  Trash2,
  RotateCcw,
  XCircle,
  Calendar,
  Settings,
  HardDrive,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import { Badge } from "@/components/UI/Badge";
import { JobProgress, StatusTimeline, getStatusConfig } from "@/components/jobsUI";
import { useJobWithActions } from "@/lib/hooks/useJob";
import { showSuccessToast, showErrorToast } from "@/components/providers";
import type { JobFile } from "@/types";
import { format, formatDistanceToNow } from "date-fns";


function formatOperationName(operationName: string): string {
  return operationName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}


function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "PPpp");
  } catch {
    return "-";
  }
}


function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "-";
  }
}


/**
 * Format file size in bytes to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  if (unitIndex === 0) {
    return `${Math.round(size)} ${units[unitIndex]}`;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}


function formatDuration(seconds: number): string {
  if (seconds < 0) return "0s";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(" ");
}


const PARAMETER_LABELS: Record<string, string> = {
  // Size-related
  input_size: "Original Size",
  output_size: "Processed Size",
  file_size: "File Size",
  original_size: "Original Size",
  processed_size: "Processed Size",
  
  // Duration/Time
  duration: "Duration",
  processing_time: "Processing Time",
  
  // Video parameters
  codec: "Video Codec",
  video_codec: "Video Codec",
  audio_codec: "Audio Codec",
  preset: "Encoding Preset",
  quality: "Quality (CRF)",
  crf: "Quality (CRF)",
  bitrate: "Bitrate",
  video_bitrate: "Video Bitrate",
  audio_bitrate: "Audio Bitrate",
  resolution: "Resolution",
  width: "Width",
  height: "Height",
  fps: "Frame Rate",
  frame_rate: "Frame Rate",
  
  // Audio parameters
  sample_rate: "Sample Rate",
  channels: "Channels",
  
  // Image parameters
  format: "Format",
  output_format: "Output Format",
  
  // Compression
  compression_ratio: "Space Saved",
  compression_level: "Compression Level",
  
  // Metadata
  has_audio: "Has Audio",
  has_video: "Has Video",
};

// Keys that represent file sizes (in bytes)
const SIZE_KEYS = new Set([
  "input_size",
  "output_size",
  "file_size",
  "original_size",
  "processed_size",
]);


const DURATION_KEYS = new Set([
  "duration",
  "processing_time",
]);


const PERCENTAGE_KEYS = new Set([
  "compression_ratio",
  "progress",
]);


const BITRATE_KEYS = new Set([
  "bitrate",
  "video_bitrate",
  "audio_bitrate",
]);


function formatValueByKey(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  
  const lowerKey = key.toLowerCase();
  
  // Handle file sizes
  if (SIZE_KEYS.has(lowerKey) && typeof value === "number") {
    return formatFileSize(value);
  }
  
  // Handle durations
  if (DURATION_KEYS.has(lowerKey) && typeof value === "number") {
    return formatDuration(value);
  }
  
  // Handle percentages
  if (PERCENTAGE_KEYS.has(lowerKey) && typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }
  
  // Handle bitrates
  if (BITRATE_KEYS.has(lowerKey)) {
    if (typeof value === "number") {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} Mbps`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)} kbps`;
      }
      return `${value} bps`;
    }
    
    if (typeof value === "string") {
      const match = value.match(/^(\d+)k$/i);
      if (match) {
        return `${match[1]} kbps`;
      }
      return value;
    }
  }
  
  // Handle sample rate
  if (lowerKey === "sample_rate" && typeof value === "number") {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} kHz`;
    }
    return `${value} Hz`;
  }
  
  // Handle channels
  if (lowerKey === "channels") {
    if (value === 1) return "Mono";
    if (value === 2) return "Stereo";
    if (typeof value === "number") return `${value} channels`;
  }
  
  // Handle resolution (width/height combined)
  if ((lowerKey === "width" || lowerKey === "height") && typeof value === "number") {
    return `${value}px`;
  }
  
  // Handle frame rate
  if ((lowerKey === "fps" || lowerKey === "frame_rate") && typeof value === "number") {
    return `${value} fps`;
  }
  
  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  // Handle numbers
  if (typeof value === "number") {
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return String(value);
  }
  
  // Handle strings
  if (typeof value === "string") {
    if (lowerKey === "codec" || lowerKey === "video_codec" || lowerKey === "audio_codec") {
      return value.toUpperCase();
    }
    if (lowerKey === "preset") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((v) => formatValueByKey(key, v)).join(", ");
  }
  
  // Handle nested objects
  if (typeof value === "object") {
    try {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return "-";
      return entries
        .map(([k, v]) => `${getParameterLabel(k)}: ${formatValueByKey(k, v)}`)
        .join(", ");
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}


function getParameterLabel(key: string): string {
  const label = PARAMETER_LABELS[key.toLowerCase()];
  if (label) return label;
  
  // Fall back to formatting the key itself
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function formatParameters(
  params: Record<string, unknown>
): { key: string; value: string }[] {
  return Object.entries(params).map(([key, value]) => ({
    key: getParameterLabel(key),
    value: formatValueByKey(key, value),
  }));
}


export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    job,
    isLoading,
    isError,
    error,
    isActive,
    isSuccess,
    isFailed,
    deleteJob,
    retryJob,
    cancelJob,
    isDeleting,
    isRetrying,
    isCancelling,
    isActioning,
  } = useJobWithActions(jobId, {
    enablePolling: true,
    onComplete: () => {
      showSuccessToast("Job completed successfully!");
    },
    onJobFailed: (failedJob) => {
      showErrorToast(failedJob.error_message || "Job processing failed");
    },
    onDeleteSuccess: () => {
      showSuccessToast("Job deleted");
      router.push("/");
    },
    onRetrySuccess: (newJob) => {
      showSuccessToast("Job retry started");
      router.push(`/jobs/${newJob.id}`);
    },
    onCancelSuccess: () => {
      showSuccessToast("Job cancelled");
    },
    onActionError: (err) => {
      showErrorToast(err.message || "Action failed");
    },
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleDelete = useCallback(async () => {
    await deleteJob();
    setShowDeleteConfirm(false);
  }, [deleteJob]);

  const handleRetry = useCallback(async () => {
    await retryJob();
  }, [retryJob]);

  const handleCancel = useCallback(async () => {
    await cancelJob();
  }, [cancelJob]);

  const handleDownload = useCallback(() => {
    if (job?.output_file?.download_url) {
      window.open(job.output_file.download_url, "_blank");
    }
  }, [job]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <JobDetailSkeleton />
      </div>
    );
  }

  // Error state
  if (isError || !job) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-red-50 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error?.message ||
                "The job you're looking for doesn't exist or has been deleted."}
            </p>
            <Button onClick={handleGoHome}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;
  const canDownload = isSuccess && job.output_file && !job.is_expired;
  const canRetry = isFailed;
  const canCancel = isActive;
  // const canDelete = job.can_be_deleted;

  return (
    <div className="pb-24 md:pb-10 max-w-4xl bg-[#2a2a2e] mx-auto py-8 md:px-4 md:relative md:top-0 md:left-0 md:right-0 md:bottom-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="cursor-pointer hover:text-gray-800"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isActioning}
              leftIcon={
                isCancelling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )
              }
            >
              Cancel
            </Button>
          )}

          {canRetry && (
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isActioning}
              leftIcon={
                isRetrying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )
              }
            >
              Retry
            </Button>
          )}

          {/* {canDownload && (
            <Button
              variant="primary"
              onClick={handleDownload}
              leftIcon={<Download className="h-4 w-4" />}
              className="cursor-pointer"
            >
              Download
            </Button>
          )} */}

          {/* {canDelete && (
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isActioning}
              className="text-red-500 hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )} */}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Job Header Card */}
        <Card className="p-4 rounded-none md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl text-gray-300 font-bold mb-1">
                {formatOperationName(job.operation)}
              </h1>
              {/* <p className="text-sm text-muted-foreground">Job ID: {job.id}</p> */}
            </div>
            <Badge
              variant={
                statusConfig.variant as
                  | "pending"
                  | "processing"
                  | "success"
                  | "danger"
              }
              className="text-sm px-3 py-1"
            >
              <StatusIcon
                className={`h-4 w-4 mr-1.5 ${
                  statusConfig.animate ? "animate-spin" : ""
                }`}
              />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Progress section for active jobs */}
          {isActive && (
            <div className="mt-4 pt-4 border-t">
              <JobProgress
                jobId={jobId}
                showEta
                showPercentage
                showStatus={false}
                size="lg"
              />
            </div>
          )}

          {/* Error message for failed jobs */}
          {isFailed && job.error_message && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">Processing Failed</p>
                  <p className="text-sm text-red-600 mt-1">
                    {job.error_message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success message */}
          {isSuccess && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-700">
                  Processing completed successfully!
                </p>
              </div>
            </div>
          )}

          {/* Expired warning */}
          {job.is_expired && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="font-medium text-amber-700">
                  Files have expired and are no longer available for download.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Status Timeline */}
        <Card className="p-6 hidden border-none md:block">
          <h2 className="text-lg text-gray-300 font-semibold mb-4">
            Status Timeline
          </h2>
          <StatusTimeline
            currentStatus={job.status}
            timestamps={{
              pending: job.created_at,
              processing: job.started_at ?? undefined,
              completed: job.completed_at ?? undefined,
            }}
            showTimestamps
            orientation="horizontal"
            className="text-gray-400 border-none"
          />
        </Card>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timestamps Card */}
          <Card className="p-5 rounded-none md:p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Timestamps
            </h2>
            <div className="space-y-3 text-gray-300">
              <DetailRow
                label="Created"
                value={formatDate(job.created_at)}
                subValue={formatRelativeDate(job.created_at)}
              />
              {job.started_at && (
                <DetailRow
                  label="Started"
                  value={formatDate(job.started_at)}
                  subValue={formatRelativeDate(job.started_at)}
                />
              )}
              {job.completed_at && (
                <DetailRow
                  label="Completed"
                  value={formatDate(job.completed_at)}
                  subValue={formatRelativeDate(job.completed_at)}
                />
              )}
              {job.expires_at && (
                <DetailRow
                  label="Expires"
                  value={formatDate(job.expires_at)}
                  subValue={
                    job.is_expired
                      ? "Expired"
                      : formatRelativeDate(job.expires_at)
                  }
                />
              )}
              {job.processing_time_formatted && (
                <DetailRow
                  label="Processing Time"
                  value={job.processing_time_formatted}
                  icon={<Timer className="h-4 w-4" />}
                />
              )}
            </div>
          </Card>

          {/* Parameters Card */}
          <Card className="p-5 rounded-none md:p-6">
            <h2 className="text-lg text-gray-300 font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Parameters
            </h2>
            {Object.keys(job.parameters).length > 0 ? (
              <div className="space-y-3 text-gray-300">
                {formatParameters(job.parameters).map(({ key, value }) => (
                  <DetailRow key={key} label={key} value={value} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No parameters configured
              </p>
            )}
          </Card>
        </div>

        {/* Files Section */}
        <Card className="p-5 rounded-none md:p-6">
          <h2 className="text-lg text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            Files
          </h2>
          <div className="grid text-gray-300 md:grid-cols-2 gap-4">
            {/* Input File */}
            {job.input_file && (
              <FileCard title="Input File" file={job.input_file} />
            )}

            {/* Output File */}
            {job.output_file && (
              <FileCard
                title="Output File"
                file={job.output_file}
                downloadable={canDownload ?? false}
                onDownload={handleDownload}
              />
            )}

            {/* No files placeholder */}
            {!job.input_file && !job.output_file && (
              <p className="text-sm text-muted-foreground col-span-2">
                No files available
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}


interface DetailRowProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
}

function DetailRow({ label, value, subValue, icon }: DetailRowProps) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-[0.95rem] md:text-sm text-gray-400 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className="text-right">
        <span className="text-[0.9rem] md:text-sm font-medium">{value}</span>
        {subValue && (
          <p className="text-xs text-gray-400">{subValue}</p>
        )}
      </div>
    </div>
  );
}


interface FileCardProps {
  title: string;
  file: JobFile;
  downloadable?: boolean;
  onDownload?: () => void;
}

function FileCard({ title, file, downloadable, onDownload }: FileCardProps) {
  return (
    <div className="md:p-4 bg-muted/50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <span className="text-base md:text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {downloadable && onDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="cursor-pointer hover:text-gray-800"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[0.9rem] md:text-sm text-gray-400 font-medium truncate" title={file.file_name}>
          {file.file_name}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-300">
          <span>{file.file_size_formatted}</span>
          <span>{file.mime_type}</span>
        </div>
      </div>
    </div>
  );
}


interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-red-50 rounded-full mb-4">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Delete Operation?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            This action cannot be undone. All associated files will be
            permanently deleted.
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Main card skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-full bg-muted rounded animate-pulse mt-4" />
        </div>
      </Card>

      {/* Timeline skeleton */}
      <Card className="p-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
              {i < 4 && (
                <div className="h-1 w-12 bg-muted rounded animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};