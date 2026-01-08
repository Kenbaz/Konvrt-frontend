"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { testConnection } from "@/lib/api";
import { queryKeys, staleTimes } from "@/lib/api/queryClient";
import { showSuccessToast, showErrorToast } from "@/components/providers";
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


const JobCreationForm = lazy(() =>
  import("@/components/jobsUI/JobCreationForm").then((mod) => ({
    default: mod.JobCreationForm,
  }))
);

const JobList = lazy(() =>
  import("@/components/jobsUI/JobList").then((mod) => ({
    default: mod.JobList,
  }))
);

// Lightweight loading skeleton for lazy components
function JobCreationSkeleton() {
  return (
    <div className="bg-[#2a2a2e] rounded-xl p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#3a3a3e]" />
            <div className="hidden sm:block ml-2 h-4 w-20 bg-[#3a3a3e] rounded" />
            {step < 4 && (
              <div className="w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 bg-[#3a3a3e]" />
            )}
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-48 bg-[#3a3a3e] rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-[#1a1a1e] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-[#1a1a1e] rounded-lg" />
      ))}
    </div>
  );
}

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
  const [viewMode, setViewMode] = useState<"create" | "jobs">("create");
  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobListItem | null>(null);
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

  const handleRetryConnection = useCallback(async () => {
    const result = await refetch();
    if (result.data?.connected) {
      showSuccessToast("Connection restored!");
    } else if (result.data?.error) {
      showErrorToast(result.data.error);
    }
  }, [refetch]);

  const handleJobCreated = useCallback((job: Job) => {
    showSuccessToast(`Job created! ID: ${job.id.slice(0, 8)}...`);
    setHighlightedJobId(job.id);
    setTimeout(() => setHighlightedJobId(null), 10000);
  }, []);

  const handleFormCancel = useCallback(() => {}, []);

  const handleViewJobs = useCallback(() => setViewMode("jobs"), []);
  const handleCreateNew = useCallback(() => setViewMode("create"), []);

  const handleJobClick = useCallback((job: JobListItem) => {
    setHighlightedJobId(job.id);
    setTimeout(() => setHighlightedJobId(null), 3000);
  }, []);

  const deleteDialog = useConfirmDialog({
    onConfirm: async () => {
      if (!jobToDelete) return;
      try {
        await deleteJob(jobToDelete.id);
        showSuccessToast("Job deleted successfully");
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      } catch (error) {
        showErrorToast(
          error instanceof Error ? error.message : "Failed to delete job"
        );
      } finally {
        setJobToDelete(null);
      }
    },
    onCancel: () => setJobToDelete(null),
  });

  const handleDeleteJob = useCallback(
    (job: JobListItem) => {
      setJobToDelete(job);
      deleteDialog.open();
    },
    [deleteDialog]
  );

  const retryDialog = useConfirmDialog({
    onConfirm: async () => {
      if (!jobToRetry) return;
      try {
        const newJob = await retryJob(jobToRetry.id);
        showSuccessToast(`Job retried! New ID: ${newJob.id.slice(0, 8)}...`);
        setHighlightedJobId(newJob.id);
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        setTimeout(() => setHighlightedJobId(null), 10000);
      } catch (error) {
        showErrorToast(
          error instanceof Error ? error.message : "Failed to retry job"
        );
      } finally {
        setJobToRetry(null);
      }
    },
    onCancel: () => setJobToRetry(null),
  });

  const handleRetryJob = useCallback(
    (job: JobListItem) => {
      setJobToRetry(job);
      retryDialog.open();
    },
    [retryDialog]
  );

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
            <ConnectionBadge
              status={connectionStatus}
              isLoading={isCheckingConnection}
              onRetry={handleRetryConnection}
              isRetrying={isFetching}
            />
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
                    ? "bg-[#FFFFFFDE] text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <ListOrdered className="h-4 w-4" />
              My Jobs
            </button>
          </div>
        </div>

        {/* Create Job View - Lazy loaded */}
        {viewMode === "create" && (
          <Suspense fallback={<JobCreationSkeleton />}>
            <JobCreationForm
              onJobCreated={handleJobCreated}
              onCancel={handleFormCancel}
              className=""
            />
          </Suspense>
        )}

        {/* Jobs List View - Lazy loaded */}
        {viewMode === "jobs" && (
          <div className="space-y-6">
            <Card className="md:p-6 bg-[#2a2a2e]">
              <Suspense fallback={<JobListSkeleton />}>
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
              </Suspense>
            </Card>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        {...deleteDialog.dialogProps}
        title="Delete Operation"
        message={
          jobToDelete
            ? "Are you sure you want to delete this operation? This action cannot be undone."
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        {...retryDialog.dialogProps}
        title="Retry Operation"
        message={
          jobToRetry
            ? "Are you sure you want to retry this operation? A new operation will be created with the same parameters."
            : ""
        }
        confirmText="Retry"
        cancelText="Cancel"
        variant="warning"
      />
    </main>
  );
};