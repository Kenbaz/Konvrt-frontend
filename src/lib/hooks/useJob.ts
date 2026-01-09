import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchJob,
  deleteJob,
  retryJob,
  cancelJob,
} from "../api/jobs";
import { queryKeys, staleTimes } from "../api/queryClient";
import { useJobPolling } from "./useJobPolling";
import type { Job, JobStatus, DeleteJobResponse } from "@/types";
import { isActiveStatus } from "@/types/common-types";

export interface UseJobOptions { 
    enabled?: boolean;
    enablePolling?: boolean;
    pollingInterval?: number;
    onComplete?: (job: Job) => void;
    onError?: (job: Job) => void;
};

export interface UseJobReturn { 
    job: Job | null;
    status: JobStatus | null;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    isActive: boolean;
    isComplete: boolean;
    isSuccess: boolean;
    isFailed: boolean;
    isPolling: boolean;
    progress: number;
    etaFormatted: string | null;
    refetch: () => Promise<void>;
};


export function useJob(jobId: string, options: UseJobOptions = {}): UseJobReturn { 
    const {
        enabled = true,
        enablePolling = true,
        pollingInterval = 2000,
        onComplete,
        onError,
    } = options;

    const queryClient = useQueryClient();

    const jobQuery = useQuery<Job, Error>({
        queryKey: queryKeys.jobs.detail(jobId ?? ""),
        queryFn: () => fetchJob(jobId!),
        enabled: !!jobId && enabled,
        staleTime: staleTimes.jobDetail,
    });

    const job = jobQuery.data ?? null;
    const isActive = job ? isActiveStatus(job.status) : false;

    const polling = useJobPolling(enablePolling && isActive ? jobId : null, {
      interval: pollingInterval,
      onComplete: (status) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.detail(jobId!),
        });
        if (job) {
          onComplete?.({
            ...job,
            status: status.status,
            progress: status.progress,
          });
        }
      },
      onError: (status) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.detail(jobId!),
        });
        if (job) {
          onError?.({
            ...job,
            status: status.status,
            error_message: status.error_message,
          });
        }
      },
    });

    // Use polling status if available
    const currentStatus = polling.status;
    const progress = currentStatus?.progress ?? job?.progress ?? 0;

    const refetch = useCallback(async () => {
        await jobQuery.refetch();
    }, [jobQuery]);

    return {
      job,
      status: currentStatus,
      isLoading: jobQuery.isLoading,
      isFetching: jobQuery.isFetching,
      isError: jobQuery.isError,
      error: jobQuery.error,
      isActive: polling.isActive || isActive,
      isComplete:
        polling.isComplete ||
        job?.status === "completed" ||
        job?.status === "failed",
      isSuccess: polling.isSuccess || job?.status === "completed",
      isFailed: polling.isFailed || job?.status === "failed",
      isPolling: polling.isPolling,
      progress,
      etaFormatted: polling.etaFormatted,
      refetch,
    };
};


// Hooks for job mutations (delete, retry, cancel)
export interface UseJobActionsOptions {
    onDeleteSuccess?: () => void;
    onRetrySuccess?: (newJob: Job) => void;
    onCancelSuccess?: () => void;
    onError?: (error: Error) => void;
};

export interface UseJobActionsReturn { 
    deleteJob: () => Promise<DeleteJobResponse | null>;
    retryJob: () => Promise<Job | null>;
    cancelJob: () => Promise<boolean>;
    isDeleting: boolean;
    isRetrying: boolean;
    isCancelling: boolean;
    isActioning: boolean;
};


export function useJobActions(
    jobId: string | null | undefined,
    options: UseJobActionsOptions = {}
): UseJobActionsReturn { 
    const {
        onDeleteSuccess,
        onRetrySuccess,
        onCancelSuccess,
        onError,
    } = options;

    const queryClient = useQueryClient();

    // Delete Job Mutation
    const deleteMutation = useMutation<DeleteJobResponse, Error>({
        mutationFn: () => deleteJob(jobId!),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.jobs.all,
            });
            onDeleteSuccess?.();
        },
        onError: (error) => {
            onError?.(error);
        }
    });

    // Retry Job Mutation
    const retryMutation = useMutation<Job, Error>({
        mutationFn: () => retryJob(jobId!),
        onSuccess: (newJob) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.jobs.all,
            });
            onRetrySuccess?.(newJob);
        },
        onError: (error) => {
            onError?.(error);
        }
    });

    // Cancel Job Mutation
    const cancelMutation = useMutation<{ success: boolean; message: string }, Error>({
        mutationFn: () => cancelJob(jobId!),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.jobs.detail(jobId!),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.jobs.all,
            });
            onCancelSuccess?.();
        },
        onError: (error) => {
            onError?.(error);
        }
    });

    const handleDelete =
      useCallback(async (): Promise<DeleteJobResponse | null> => {
        if (!jobId) return null;
        try {
          return await deleteMutation.mutateAsync();
        } catch {
          return null;
        }
      }, [jobId, deleteMutation]);

    const handleRetry = useCallback(async (): Promise<Job | null> => {
      if (!jobId) return null;
      try {
        return await retryMutation.mutateAsync();
      } catch {
        return null;
      }
    }, [jobId, retryMutation]);

    const handleCancel = useCallback(async (): Promise<boolean> => {
      if (!jobId) return false;
      try {
        const result = await cancelMutation.mutateAsync();
        return result.success;
      } catch {
        return false;
      }
    }, [jobId, cancelMutation]);

    return {
      deleteJob: handleDelete,
      retryJob: handleRetry,
      cancelJob: handleCancel,
      isDeleting: deleteMutation.isPending,
      isRetrying: retryMutation.isPending,
      isCancelling: cancelMutation.isPending,
      isActioning:
        deleteMutation.isPending ||
        retryMutation.isPending ||
        cancelMutation.isPending,
    };
};


/**
 * Combined hook for job details and actions
 */
export interface UseJobWithActionsOptions
  extends Omit<UseJobOptions, "onError">,
    Omit<UseJobActionsOptions, "onError"> {
  onJobFailed?: (job: Job) => void;
  onActionError?: (error: Error) => void;
}

export function useJobWithActions(
  jobId: string | null | undefined,
  options: UseJobWithActionsOptions = {}
) {
  const {
    enabled,
    enablePolling,
    pollingInterval,
    onComplete,
    onJobFailed,
    onDeleteSuccess,
    onRetrySuccess,
    onCancelSuccess,
    onActionError,
  } = options;

  const jobData = useJob(jobId!, {
    enabled,
    enablePolling,
    pollingInterval,
    onComplete,
    onError: onJobFailed,
  });

  const actions = useJobActions(jobId, {
    onDeleteSuccess,
    onRetrySuccess,
    onCancelSuccess,
    onError: onActionError,
  });

  return {
    ...jobData,
    ...actions,
  };
};