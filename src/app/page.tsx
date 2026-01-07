// src/app/page.tsx

"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { testConnection } from "@/lib/api";
import { queryKeys, staleTimes } from "@/lib/api/queryClient";
import { showSuccessToast, showErrorToast } from "@/components/providers";
import { JobCreationForm } from "@/components/jobsUI/JobCreationForm";
import { JobList } from "@/components/jobsUI/JobList";
import { ConfirmDialog, useConfirmDialog } from "@/components/UI/ConfirmDialog";
import { Button } from "@/components/UI/Button";
import { Card } from "@/components/UI/Card";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  ListOrdered,
  Plus,
} from "lucide-react";
import { deleteJob, retryJob } from "@/lib/api/jobs";
import type { ConnectionStatus } from "@/lib/api";
import type { Job, JobListItem } from "@/types/job-types";


function ConnectionBadge({
  status,
  isLoading,
  onRetry,
  isRetrying,
}: {
  status: ConnectionStatus | undefined;
  isLoading: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  if (isLoading) {
    return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />;
  }

  if (status?.connected) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Wifi className="h-4 w-4" />
        {/* <span className="text-sm">Connected ({status.latencyMs}ms)</span> */}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <WifiOff className="h-4 w-4 text-red-600" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="text-gray-500 hover:text-gray-700"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}


/**
 * Main home page component
 */
export default function HomePage() {
  // View mode: "create" shows the form, "jobs" shows the job list
  const [viewMode, setViewMode] = useState<"create" | "jobs">("create");

  // Track the most recently created job for highlighting
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);

  // Job to delete (for confirmation dialog)
  const [jobToDelete, setJobToDelete] = useState<JobListItem | null>(null);

  // Job to retry (for confirmation dialog)
  const [jobToRetry, setJobToRetry] = useState<JobListItem | null>(null);

  const queryClient = useQueryClient();

  // Connection status query
  const {
    data: connectionStatus,
    isLoading: isCheckingConnection,
    refetch,
    isFetching,
  } = useQuery<ConnectionStatus>({
    queryKey: queryKeys.health.check(),
    queryFn: testConnection,
    staleTime: staleTimes.health,
    refetchOnWindowFocus: true,
  });

  // Handle manual connection retry
  const handleRetryConnection = useCallback(async () => {
    const result = await refetch();
    if (result.data?.connected) {
      showSuccessToast("Connection restored!");
    } else if (result.data?.error) {
      showErrorToast(result.data.error);
    }
  }, [refetch]);

  // Handle job creation success
  const handleJobCreated = useCallback((job: Job) => {
    showSuccessToast(`Job created! ID: ${job.id.slice(0, 8)}...`);
    setHighlightedJobId(job.id);

    // Clear highlight after 10 seconds
    setTimeout(() => {
      setHighlightedJobId(null);
    }, 10000);
  }, []);

  // Handle form cancellation/reset
  const handleFormCancel = useCallback(() => {
    // Nothing specific to do here for now
  }, []);

  // Handle switching to jobs view
  const handleViewJobs = useCallback(() => {
    setViewMode("jobs");
  }, []);

  // Handle switching to create view
  const handleCreateNew = useCallback(() => {
    setViewMode("create");
  }, []);

  // Handle job click - could navigate to detail view in the future
  const handleJobClick = useCallback((job: JobListItem) => {
    // For now, just highlight the job
    setHighlightedJobId(job.id);
    setTimeout(() => {
      setHighlightedJobId(null);
    }, 3000);
  }, []);

  // Confirm delete dialog
  const deleteDialog = useConfirmDialog({
    onConfirm: async () => {
      if (!jobToDelete) return;

      try {
        await deleteJob(jobToDelete.id);
        showSuccessToast("Job deleted successfully");

        // Refresh job list
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      } catch (error) {
        showErrorToast(
          error instanceof Error ? error.message : "Failed to delete job"
        );
      } finally {
        setJobToDelete(null);
      }
    },
    onCancel: () => {
      setJobToDelete(null);
    },
  });

  // Handle job deletion
  const handleDeleteJob = useCallback(
    (job: JobListItem) => {
      setJobToDelete(job);
      deleteDialog.open();
    },
    [deleteDialog]
  );

  // Confirm retry dialog
  const retryDialog = useConfirmDialog({
    onConfirm: async () => {
      if (!jobToRetry) return;

      try {
        const newJob = await retryJob(jobToRetry.id);
        showSuccessToast(`Job retried! New ID: ${newJob.id.slice(0, 8)}...`);
        setHighlightedJobId(newJob.id);

        // Refresh job list
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });

        // Clear highlight after a while
        setTimeout(() => {
          setHighlightedJobId(null);
        }, 10000);
      } catch (error) {
        showErrorToast(
          error instanceof Error ? error.message : "Failed to retry job"
        );
      } finally {
        setJobToRetry(null);
      }
    },
    onCancel: () => {
      setJobToRetry(null);
    },
  });

  // Handle retry job
  const handleRetryJob = useCallback((job: JobListItem) => {
    setJobToRetry(job);
    retryDialog.open()
  }, [retryDialog]);

  // Check if backend is available
  const isBackendAvailable = connectionStatus?.connected ?? false;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#1a1a1a] text-textPrimary">
      {/* Header */}
      <header className="bg-[#121214] border-b border-[#2a2a2e] sticky top-0 left-0 right-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-[#f4f4f5]">Konvrt</h1>
              <p className="text-sm text-[#71717a]">Process Media</p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionBadge
                status={connectionStatus}
                isLoading={isCheckingConnection}
                onRetry={handleRetryConnection}
                isRetrying={isFetching}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-3 md:px-6 lg:px-8 py-8">
        {/* Backend unavailable warning */}
        {!isCheckingConnection && !isBackendAvailable && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Backend Not Available
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  The backend server is not responding. Job creation will not
                  work until the connection is restored.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  disabled={isFetching}
                  className="mt-3"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${
                      isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={handleCreateNew}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                ${
                  viewMode === "create"
                    ? "bg-[#FFFFFFDE] text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <Plus className="h-4 w-4" />
              Create Job
            </button>
            <button
              onClick={handleViewJobs}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
                ${
                  viewMode === "jobs"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <ListOrdered className="h-4 w-4" />
              My Jobs
            </button>
          </div>
        </div>

        {/* Create Job View */}
        {viewMode === "create" && (
          <>
            <JobCreationForm
              onJobCreated={handleJobCreated}
              onCancel={handleFormCancel}
              className=""
            />
          </>
        )}

        {/* Jobs List View */}
        {viewMode === "jobs" && (
          <div className="space-y-6">
            {/* Jobs List Card */}
            <Card className=" md:p-6 bg-[#2a2a2e]">
              <JobList
                limit={20}
                autoRefresh={true}
                refreshInterval={60000}
                onJobClick={handleJobClick}
                onDelete={handleDeleteJob}
                onRetry={handleRetryJob}
                showActions={true}
                showHeader={true}
                headerTitle="Your Processing Jobs"
                highlightedJobId={highlightedJobId ?? undefined}
              />
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        {...deleteDialog.dialogProps}
        title="Delete Operation"
        message={
          jobToDelete
            ? `Are you sure you want to delete this operation? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Retry Confirmation Dialog */}
      <ConfirmDialog
        {...retryDialog.dialogProps}
        title="Retry Operation"
        message={
          jobToRetry
            ? `Are you sure you want to retry this operation? A new operation will be created with the same parameters.`
            : ""
        }
        confirmText="Retry"
        cancelText="Cancel"
        variant="warning"
      />
    </main>
  );
};