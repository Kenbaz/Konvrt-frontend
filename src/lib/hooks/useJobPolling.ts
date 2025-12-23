// src/lib/hooks/useJobPolling.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJobStatus, fetchJob } from "../api/jobs";
import { queryKeys, pollingIntervals } from "../api/queryClient";
import type { JobStatus, Job } from "@/types";
import { isActiveStatus } from "@/types/common-types";

export interface UseJobPollingOptions {
    interval?: number;
    enabled?: boolean;
    onStatusChange?: (status: JobStatus) => void;
    onComplete?: (status: JobStatus) => void;
    onError?: (status: JobStatus) => void;
    onProgress?: (progress: number, eta: number | null) => void;
    maxAttempts?: number;
};

export interface UseJobPollingReturn {
    status: JobStatus | null;
    progress: number;
    etaSeconds: number | null;
    etaFormatted: string | null;
    isActive: boolean;
    isComplete: boolean;
    isSuccess: boolean;
    isFailed: boolean;
    isPolling: boolean;
    isError: boolean;
    errorMessage: string | null;
    startPolling: () => void;
    stopPolling: () => void;
    refetch: () => Promise<void>;
};


function formatEta(seconds: number | null): string | null { 
    if (seconds === null || seconds <= 0) return null;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) { 
        return `${hours}h ${minutes}m`;
    };
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    };
    return `${secs}s`;
};


export function useJobPolling(
    jobId: string | null | undefined,
    options: UseJobPollingOptions = {}
): UseJobPollingReturn {
  const {
    interval = pollingIntervals.activeJob,
    enabled: enabledOption,
    onStatusChange,
    onComplete,
    onError,
    onProgress,
    maxAttempts = 1800,
  } = options;

  const queryClient = useQueryClient();
  const attemptCountRef = useRef(0);
  const previousStatusRef = useRef<string | null>(null);
  const previousProgressRef = useRef<number>(0);

  const [isPollingEnabled, setIsPollingEnabled] = useState(true);

  // Main status query with polling
  const query = useQuery<JobStatus, Error>({
    queryKey: queryKeys.jobs.status(jobId ?? ""),
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !!jobId && isPollingEnabled && (enabledOption ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.is_complete) return false;
      if (attemptCountRef.current >= maxAttempts) return false;
      return interval;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const status = query.data ?? null;
  const progress = status?.progress ?? 0;
  const etaSeconds = status?.eta_seconds ?? null;

  useEffect(() => {
    if (query.isFetching) {
      attemptCountRef.current += 1;
    }
  }, [query.isFetching]);

  useEffect(() => {
    if (!status) return;

    // Notify on status change
    if (previousStatusRef.current !== status.status) {
      onStatusChange?.(status);
      previousStatusRef.current = status.status;
    }

    // Notify on progress change
    if (previousProgressRef.current !== status.progress) {
      onProgress?.(status.progress, status.eta_seconds);
      previousProgressRef.current = status.progress;
    }

    // Handle completion
    if (status.is_complete) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPollingEnabled(false);

      if (status.status === "completed") {
        onComplete?.(status);
      } else if (status.status === "failed") {
        onError?.(status);
      }

      // Invalidate job list and detail queries to refresh them
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    }
  }, [status, onStatusChange, onComplete, onError, onProgress, queryClient]);

  // Derived states
  const isActive = status ? isActiveStatus(status.status) : false;
  const isComplete = status?.is_complete ?? false;
  const isSuccess = status?.status === "completed";
  const isFailed = status?.status === "failed";
  const isPolling = query.isFetching || (isActive && isPollingEnabled);

  // Manual controls
  const startPolling = useCallback(() => {
    attemptCountRef.current = 0;
    setIsPollingEnabled(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPollingEnabled(false);
  }, []);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    status,
    progress,
    etaSeconds,
    etaFormatted: formatEta(etaSeconds),
    isActive,
    isComplete,
    isSuccess,
    isFailed,
    isPolling,
    isError: query.isError,
    errorMessage: status?.error_message ?? null,
    startPolling,
    stopPolling,
    refetch,
  };
};


export interface UseMultiJobPollingOptions {
    interval?: number;
    onStatusChange?: (jobId: string, status: JobStatus) => void;
    onJobComplete?: (jobId: string, status: JobStatus) => void;
};

export interface MultiJobPollingState {
    statuses: Map<string, JobStatus>;
    progress: Map<string, number>;
    activeJobIds: string[];
    completedJobIds: string[];
    hasActiveJobs: boolean;
    allComplete: boolean;
};


export function useMultiJobPolling(
    jobIds: string[],
    options: UseMultiJobPollingOptions = {}
): MultiJobPollingState { 
    const {
        interval = pollingIntervals.activeJob,
        onStatusChange,
        onJobComplete,
    } = options;

    const [statuses, setStatuses] = useState<Map<string, JobStatus>>(new Map());
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

    const queryClient = useQueryClient();

    const activeJobIds = useMemo(
      () => jobIds.filter((id) => !completedIds.has(id)),
      [jobIds, completedIds]
    );

    // Create queries for all active jobs
    const queries = useQuery<JobStatus[], Error>({
        queryKey: [...queryKeys.jobs.all, "multi-status", ...activeJobIds],
        queryFn: async () => {
            const results = await Promise.all(
                activeJobIds.map((id) => fetchJobStatus(id))
            );
            return results;
        },
        enabled: activeJobIds.length > 0,
        refetchInterval: activeJobIds.length > 0 ? interval : false,
        staleTime: 0,
    });

    useEffect(() => {
      if (!queries.data) return;

      const newStatuses = new Map(statuses);
      const newCompleted = new Set(completedIds);
      let hasChanges = false;

      queries.data.forEach((status, index) => {
        const jobId = activeJobIds[index];
        const prevStatus = statuses.get(jobId);

        newStatuses.set(jobId, status);

        // Check if status changed
        if (prevStatus?.status !== status.status) {
          hasChanges = true;
          onStatusChange?.(jobId, status);
        }

        // Check if job completed
        if (status.is_complete && !completedIds.has(jobId)) {
          hasChanges = true;
          newCompleted.add(jobId);
          onJobComplete?.(jobId, status);

          // Invalidate queries for this job
          queryClient.invalidateQueries({
            queryKey: queryKeys.jobs.detail(jobId),
          });
        }
      });

      // Only update state if there were actual changes
      if (hasChanges) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatuses(newStatuses);
        setCompletedIds(newCompleted);
      }
    }, [
      queries.data,
      activeJobIds,
      onStatusChange,
      onJobComplete,
      queryClient,
      statuses,
      completedIds,
    ]);

    const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    statuses.forEach((status, id) => {
      map.set(id, status.progress);
    });
    return map;
  }, [statuses]);

  return {
    statuses,
    progress: progressMap,
    activeJobIds,
    completedJobIds: Array.from(completedIds),
    hasActiveJobs: activeJobIds.length > 0,
    allComplete: jobIds.length > 0 && activeJobIds.length === 0,
  };
};


/**
 * Hook that combines job data with real-time polling.
 * Fetches full job details and polls for status updates.
 */
export interface UseJobWithPollingOptions extends UseJobPollingOptions {
  fetchDetails?: boolean;
}

export interface UseJobWithPollingReturn extends UseJobPollingReturn {
  job: Job | null;
  isLoadingJob: boolean;
}

export function useJobWithPolling(
  jobId: string | null | undefined,
  options: UseJobWithPollingOptions = {}
): UseJobWithPollingReturn {
  const { fetchDetails = true, ...pollingOptions } = options;

  // Get polling state
  const polling = useJobPolling(jobId, pollingOptions);

  // Fetch full job details
  const jobQuery = useQuery<Job, Error>({
    queryKey: queryKeys.jobs.detail(jobId ?? ""),
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId && fetchDetails,
    staleTime: 15000, // 15 seconds
    // Refetch when job completes to get final details
    refetchOnMount: polling.isComplete,
  });

  return {
    ...polling,
    job: jobQuery.data ?? null,
    isLoadingJob: jobQuery.isLoading,
  };
}

/**
 * Simple hook to check if a job is still processing.
 * Lighter weight than full polling - just checks current status.
 */
export function useIsJobActive(jobId: string | null | undefined): {
  isActive: boolean;
  isLoading: boolean;
} {
  const query = useQuery<JobStatus, Error>({
    queryKey: queryKeys.jobs.status(jobId ?? ""),
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !!jobId,
    staleTime: 5000,
  });

  return {
    isActive: query.data ? isActiveStatus(query.data.status) : false,
    isLoading: query.isLoading,
  };
}