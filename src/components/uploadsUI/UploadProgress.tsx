"use client";

import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import {
  formatUploadSpeed,
  formatTimeRemaining,
  type UploadProgress as UploadProgressData,
} from "@/lib/api/upload";
import type { UploadStatus } from "@/lib/hooks";


export interface UploadProgressProps {
  status: UploadStatus;
  progress: UploadProgressData | null;
  error?: string | null;
  fileName?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
};


export function UploadProgress({
  status,
  progress,
  error,
  fileName,
  onCancel,
  onRetry,
  onDismiss,
  className = "",
}: UploadProgressProps) {
  // Don't render if idle
  if (status === "idle") {
    return null;
  }

  const percentage = progress?.percentage ?? 0;
  const isComplete = status === "success";
  const isFailed = status === "error";
  const isCancelled = status === "cancelled";
  const isUploading = status === "uploading";
  const isSaving = status === "saving";

  return (
    <div
      className={`bg-[#1a1a1e] rounded-lg border shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {(isUploading || isSaving) && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {(isFailed || isCancelled) && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}

          <span className="text-sm font-medium text-gray-300">
            {isUploading && "Uploading..."}
            {isSaving && "Saving to storage..."}
            {isComplete && "Upload Complete"}
            {isFailed && "Upload Failed"}
            {isCancelled && "Upload Cancelled"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(isUploading || isSaving) && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {(isComplete || isFailed || isCancelled) && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {/* File name */}
        {fileName && (
          <p className="text-sm text-gray-400 truncate mb-2" title={fileName}>
            {fileName}
          </p>
        )}

        {/* Progress bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 bg-[#1a1a1e] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Progress details */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <span>{percentage}%</span>
                {progress && (
                  <>
                    {/* <span>â€¢</span> */}
                    <span>
                      {formatFileSize(progress.loaded)} /{" "}
                      {formatFileSize(progress.total)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {progress && progress.bytesPerSecond > 0 && (
                  <span>{formatUploadSpeed(progress.bytesPerSecond)}</span>
                )}
                {progress && progress.estimatedTimeRemaining !== null && (
                  <>
                    {/* <span>â€¢</span> */}
                    <span>
                      {formatTimeRemaining(progress.estimatedTimeRemaining)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saving to cloud storage state - indeterminate progress */}
        {isSaving && (
          <div className="space-y-2">
            <div className="h-2 bg-[#1a1a1e] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Finalizing upload to storage...</span>
              {progress && (
                <span>{formatFileSize(progress.total)}</span>
              )}
            </div>
          </div>
        )}

        {/* Success state */}
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>File uploaded successfully</span>
          </div>
        )}

        {/* Error state */}
        {isFailed && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error || "Upload failed. Please try again."}</span>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Upload was cancelled</span>
            {onRetry && (
              <>
                {/* <span>â€¢</span> */}
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-blue-600 cursor-pointer hover:text-blue-700 font-medium"
                >
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact upload progress for inline use
 */
export function UploadProgressCompact({
  status,
  progress,
  onCancel,
  className = "",
}: {
  status: UploadStatus;
  progress: UploadProgressData | null;
  onCancel?: () => void;
  className?: string;
}) {
  const isUploading = status === "uploading";
  const isSaving = status === "saving";

  if (!isUploading && !isSaving) {
    return null;
  }

  const percentage = progress?.percentage ?? 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-blue-500 rounded-full ${
              isSaving ? 'animate-pulse' : 'transition-all duration-300 ease-out'
            }`}
            style={{ width: `${isSaving ? 100 : percentage}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-gray-500 shrink-0 min-w-10 text-right">
        {isSaving ? "Saving..." : `${percentage}%`}
      </span>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Cancel upload"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};


export function UploadProgressBar({
  percentage,
  className = "",
}: {
  percentage: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
};