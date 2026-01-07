// src/components/jobs/DownloadButton.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "../UI/Button";
import { Progress } from "../UI/Progress";
import {
  downloadJobOutput,
  triggerBrowserDownload,
  revokeDownloadUrl,
  createDownloadController,
  formatDownloadProgress,
  formatFileSize,
  DownloadError,
} from "@/lib/api/download";
import type { DownloadResult } from "@/lib/api/download";
import type { Job, JobListItem } from "@/types";


type DownloadStatus = "idle" | "downloading" | "completed" | "error";


interface DownloadState {
  status: DownloadStatus;
  progress: number;
  loaded: number;
  total: number;
  error: string | null;
  errorCode: string | null;
  retryable: boolean;
  filename: string | null;
}

const INITIAL_STATE: DownloadState = {
  status: "idle",
  progress: 0,
  loaded: 0,
  total: 0,
  error: null,
  errorCode: null,
  retryable: false,
  filename: null,
};

export interface DownloadButtonProps {
  job: Job | JobListItem;
  filename?: string;
  variant?: "primary" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  showSize?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: (result: DownloadResult) => void;
  onDownloadError?: (error: DownloadError) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function DownloadButton({
  job,
  filename,
  variant = "outline",
  size = "md",
  showProgress = true,
  showSize = false,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  className = "",
  disabled = false,
  compact = false,
}: DownloadButtonProps) {
  const [state, setState] = useState<DownloadState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);
  const downloadResultRef = useRef<DownloadResult | null>(null);

  // Check if job can be downloaded
  const canDownload =
    job.status === "completed" &&
    !job.is_expired &&
    (("has_output" in job && job.has_output) ||
      ("output_file" in job && job.output_file !== null));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any in-progress download
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (downloadResultRef.current) {
        revokeDownloadUrl(downloadResultRef.current.url);
      }
    };
  }, []);

  const handleDownload = useCallback(async () => {
    if (!canDownload || state.status === "downloading") return;

    setState({
      ...INITIAL_STATE,
      status: "downloading",
    });

    abortControllerRef.current = createDownloadController();

    onDownloadStart?.();

    try {
      const result = await downloadJobOutput(
        job.id,
        {
          filename,
          onProgress: ({ loaded, total, percentage }) => {
            setState((prev) => ({
              ...prev,
              progress: percentage >= 0 ? percentage : -1,
              loaded,
              total,
            }));
          },
        },
        abortControllerRef.current
      );

      downloadResultRef.current = result;

      // Trigger browser download
      triggerBrowserDownload(result.blob, result.filename);

      setState((prev) => ({
        ...prev,
        status: "completed",
        progress: 100,
        filename: result.filename,
        loaded: result.size,
        total: result.size,
      }));

      onDownloadComplete?.(result);

      // Reset to idle after a short delay
      setTimeout(() => {
        setState((prev) => {
          if (prev.status === "completed") {
            return { ...INITIAL_STATE };
          }
          return prev;
        });
      }, 3000);
    } catch (error) {
      const downloadError =
        error instanceof DownloadError
          ? error
          : new DownloadError(
              error instanceof Error ? error.message : "Download failed",
              "UNKNOWN_ERROR",
              0,
              true
            );

      setState((prev) => ({
        ...prev,
        status: "error",
        error: downloadError.message,
        errorCode: downloadError.code,
        retryable: downloadError.retryable,
      }));

      onDownloadError?.(downloadError);
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    canDownload,
    job.id,
    filename,
    state.status,
    onDownloadStart,
    onDownloadComplete,
    onDownloadError,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    setState(INITIAL_STATE);
    setTimeout(() => {
      handleDownload();
    }, 100);
  }, [handleDownload]);


  const handleReDownload = useCallback(() => {
    if (downloadResultRef.current) {
      triggerBrowserDownload(
        downloadResultRef.current.blob,
        downloadResultRef.current.filename
      );
    } else {
      handleDownload();
    }
  }, [handleDownload]);

  if (!canDownload) {
    return null;
  }

  
  const isDownloading = state.status === "downloading";
  const isCompleted = state.status === "completed";
  const isError = state.status === "error";

  // Progress display
  const showProgressBar = showProgress && isDownloading && state.total > 0;
  const progressText =
    isDownloading && state.total > 0
      ? formatDownloadProgress(state.loaded, state.total)
      : isDownloading && state.loaded > 0
      ? formatFileSize(state.loaded)
      : null;

  if (compact) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={disabled || isDownloading}
        className={className}
        title={isDownloading ? "Downloading..." : "Download"}
        leftIcon={
          isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : isError ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <Download className="h-4 w-4" />
          )
        }
      >
        {/* {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : isError ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <Download className="h-4 w-4" />
        )} */}
      </Button>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{state.error}</span>
        </div>
        {state.retryable && (
          <Button
            variant="outline"
            size={size}
            onClick={handleRetry}
            className="w-full cursor-pointer"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Retry Download
          </Button>
        )}
      </div>
    );
  }

  // Downloading state with progress
  if (isDownloading) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Button variant={variant} size={size} disabled className="flex-1">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {state.progress >= 0 ? `${state.progress}%` : "Downloading..."}
          </Button>
          <Button
            variant="ghost"
            size={size}
            onClick={handleCancel}
            title="Cancel download"
            className="cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {showProgressBar && (
          <Progress value={state.progress} className="h-1.5" />
        )}
        {progressText && (
          <p className="text-xs text-muted-foreground text-center">
            {progressText}
          </p>
        )}
      </div>
    );
  }

  // Completed state (briefly shown before reset)
  if (isCompleted) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleReDownload}
        className={`${className}`}
        leftIcon={<CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />}
      >
        Downloaded
        {showSize && state.total > 0 && (
          <span className="ml-1 text-muted-foreground">
            ({formatFileSize(state.total)})
          </span>
        )}
      </Button>
    );
  }

  // Idle state - default download button
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled}
      className={className}
      leftIcon={<Download className="h-4 w-4" />}
    >
      Download
    </Button>
  );
}


export interface InlineDownloadButtonProps {
  job: Job | JobListItem;
  onDownloadComplete?: (result: DownloadResult) => void;
  onDownloadError?: (error: DownloadError) => void;
  className?: string;
  disabled?: boolean;
}

export function InlineDownloadButton({
  job,
  onDownloadComplete,
  onDownloadError,
  className = "",
  disabled = false,
}: InlineDownloadButtonProps) {
  return (
    <DownloadButton
      job={job}
      compact
      variant="ghost"
      size="sm"
      showProgress={false}
      onDownloadComplete={onDownloadComplete}
      onDownloadError={onDownloadError}
      className={className}
      disabled={disabled}
    />
  );
}


export interface DownloadWithInfoProps
  extends Omit<DownloadButtonProps, "showSize"> {
  showFileInfo?: boolean;
}

export function DownloadWithInfo({
  job,
  showFileInfo = true,
  ...props
}: DownloadWithInfoProps) {
  // Get output file info if available
  const outputFile = "output_file" in job ? job.output_file : null;

  return (
    <div className="flex flex-col gap-2">
      {showFileInfo && outputFile && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="truncate max-w-48" title={outputFile.file_name}>
            {outputFile.file_name}
          </span>
          <span className="shrink-0 ml-2">
            {outputFile.file_size_formatted ||
              formatFileSize(outputFile.file_size)}
          </span>
        </div>
      )}
      <DownloadButton job={job} showSize={!showFileInfo} {...props} />
    </div>
  );
};