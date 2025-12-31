"use client";

import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
  FileVideo,
  FileImage,
  FileAudio,
  File,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "../UI/Button";
import { Progress } from "../UI/Progress";
import { DownloadButton } from "../jobsUI/DownloadButton";
import { useJobWithPolling } from "@/lib/hooks/useJobPolling";
import type { Job, JobStatus } from "@/types/job-types";


function getOperationIcon(operationName: string): React.ReactNode {
  const lowerName = operationName.toLowerCase();
  const iconClass = "h-6 w-6 text-muted-foreground";

  if (
    lowerName.includes("video") ||
    lowerName.includes("compress") ||
    lowerName.includes("convert_video")
  ) {
    return <FileVideo className={iconClass} />;
  }
  if (
    lowerName.includes("image") ||
    lowerName.includes("resize") ||
    lowerName.includes("convert_image")
  ) {
    return <FileImage className={iconClass} />;
  }
  if (
    lowerName.includes("audio") ||
    lowerName.includes("extract_audio") ||
    lowerName.includes("convert_audio")
  ) {
    return <FileAudio className={iconClass} />;
  }
  return <File className={iconClass} />;
}


function formatOperationName(operationName: string): string {
  return operationName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Job Progress Tracker Component
 *
 * Displays real-time progress for a created job and shows download button when complete
 */
interface JobProgressTrackerProps {
  job: Job;
  onReset: () => void;
  onJobComplete?: (status: JobStatus) => void;
  onJobFailed?: (status: JobStatus) => void;
}

export function JobProgressTracker({
  job,
  onReset,
  onJobComplete,
  onJobFailed,
}: JobProgressTrackerProps) {
  const {
    job: updatedJob,
    status,
    progress,
    etaFormatted,
    isActive,
    isSuccess,
    isFailed,
    isPolling,
  } = useJobWithPolling(job.id, {
    interval: 2000,
    fetchDetails: true,
    onComplete: onJobComplete,
    onError: onJobFailed,
  });

  const currentJob = updatedJob ?? job;

  const currentStatus = status?.status ?? currentJob.status;
  const currentProgress = status?.progress ?? progress;
  const errorMessage = status?.error_message ?? currentJob.error_message;

  // Status display configurations
  const getStatusDisplay = () => {
    switch (currentStatus) {
      case "pending":
        return {
          icon: <Clock className="h-5 w-5" />,
          label: "Waiting to start...",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        };
      case "queued":
        return {
          icon: <Clock className="h-5 w-5 animate-pulse" />,
          label: "In queue...",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        };
      case "processing":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          label: "Processing...",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: "Completed!",
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case "failed":
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: "Failed",
          color: "text-red-600",
          bgColor: "bg-red-100",
        };
      default:
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          label: "Processing...",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-6">
      {/* Job Info Header */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          {getOperationIcon(currentJob.operation)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">
            {formatOperationName(currentJob.operation)}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            Job ID: {currentJob.id.slice(0, 8)}...
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}
        >
          {statusDisplay.icon}
          <span className="text-sm font-medium">{statusDisplay.label}</span>
        </div>
      </div>

      {isActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <div className="flex items-center gap-3">
              {etaFormatted && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Zap className="h-4 w-4" />~{etaFormatted} remaining
                </span>
              )}
              <span className="font-mono text-gray-900">
                {currentProgress}%
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress value={currentProgress} className="h-3" />
            {isPolling && currentProgress > 0 && currentProgress < 100 && (
              <div
                className="absolute top-0 left-0 h-3 bg-white/30 animate-pulse rounded-full"
                style={{ width: `${currentProgress}%` }}
              />
            )}
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-medium text-lg">
                Processing Complete!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Your file is ready to download
              </p>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <DownloadButton
              job={currentJob}
              variant="primary"
              size="lg"
              showProgress={true}
              showSize={true}
              className="w-full"
            />
            <Button onClick={onReset} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Create Another Job
            </Button>
          </div>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-medium text-lg">
                Processing Failed
              </p>
              {errorMessage && (
                <p className="text-sm text-red-600 mt-2 max-w-md">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onReset} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      )}

      {isActive && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            You can close this page. Your job will continue processing in the
            background.
          </p>
        </div>
      )}
    </div>
  );
};