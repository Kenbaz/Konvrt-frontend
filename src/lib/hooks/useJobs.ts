import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchJobs, fetchRecentJobs, fetchJobsByStatus } from "../api";
import { queryKeys, staleTimes, pollingIntervals } from "../api/queryClient";
import type { JobListItem, ListJobsParams, PaginatedResponse } from "@/types";
import { isActiveStatus } from "@/types";

export interface UseJobsOptions { 
    page?: number;
    pageSize?: number;
    status?: string;
    operation?: string;
    ordering?: string;
    autoRefresh?: boolean;
    refetchInterval?: number;
    enabled?: boolean;
};

export interface UseJobsReturn {
    jobs: JobListItem[];
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    activeJobsCount: number;
    activeJobs: JobListItem[];
};

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const {
    page = 1,
    pageSize = 10,
    status,
    operation,
    ordering = "-created_at",
    autoRefresh = true,
    refetchInterval = pollingIntervals.jobList,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  // Build query params
  const queryParams: ListJobsParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(status && { status }),
      ...(operation && { operation }),
      ordering,
    }),
    [page, pageSize, status, operation, ordering]
  );

  // Build query key with filters for proper caching
  const queryKey = useMemo(
    () => queryKeys.jobs.list(queryParams as Record<string, unknown>),
    [queryParams]
  );

  // Main jobs query
  const query = useQuery<PaginatedResponse<JobListItem>, Error>({
    queryKey,
    queryFn: () => fetchJobs(queryParams),
    staleTime: staleTimes.jobList,
    enabled,
    refetchInterval: autoRefresh ? refetchInterval : false,
    placeholderData: (previousData) => previousData,
  });

  // Derived state
  const jobs = useMemo(() => query.data?.results ?? [], [query.data]);
  const totalCount = query.data?.count ?? 0;
  const hasNextPage = query.data?.next !== null;
  const hasPreviousPage = query.data?.previous !== null;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate active jobs
  const { activeJobs, activeJobsCount } = useMemo(() => {
    const active = jobs.filter((job) => isActiveStatus(job.status));

    return {
      activeJobs: active,
      activeJobsCount: active.length,
    };
  }, [jobs]);

  // Refetch function
  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  // Pagination handlers - these update the query params which will trigger a refetch
  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        // Invalidate and refetch with new page
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      }
    },
    [queryClient, totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  }, [goToPage, hasNextPage, page]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(page - 1);
    }
  }, [goToPage, hasPreviousPage, page]);

  return {
    jobs,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    currentPage: page,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
    goToPage,
    nextPage,
    previousPage,
    activeJobsCount,
    activeJobs,
  };
};


// Hook for fetching recent jobs (simplified, no pagination)
export interface UseRecentJobsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

export interface UseRecentJobsReturn {
  jobs: JobListItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  activeJobsCount: number;
  activeJobs: JobListItem[];
  hasActiveJobs: boolean;
};

export function useRecentJobs(
    options: UseRecentJobsOptions = {}
): UseRecentJobsReturn {
  const {
    limit = 10,
    autoRefresh = true,
    refreshInterval = pollingIntervals.jobList,
    enabled = true,
  } = options;

  const query = useQuery<JobListItem[], Error>({
    queryKey: [...queryKeys.jobs.lists(), "recent", limit] as const,
    queryFn: () => fetchRecentJobs(limit),
    staleTime: staleTimes.jobList,
    enabled,
    refetchInterval: autoRefresh ? refreshInterval : false,
    placeholderData: (previousData) => previousData,
  });

  const jobs = useMemo(() => query.data ?? [], [query.data]);

  // Calculate active jobs
  const { activeJobs, activeJobsCount } = useMemo(() => {
    const active = jobs.filter((job) => isActiveStatus(job.status));
    return {
      activeJobs: active,
      activeJobsCount: active.length,
    };
  }, [jobs]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    jobs,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
    activeJobsCount,
    activeJobs,
    hasActiveJobs: activeJobsCount > 0,
  };
};


// Hook for fetching jobs filtered by status

export interface UseJobsByStatusOptions {
  status: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useJobsByStatus(options: UseJobsByStatusOptions) {
  const {
    status,
    limit = 20,
    autoRefresh = true,
    refreshInterval = pollingIntervals.jobList,
    enabled = true,
  } = options;

  const query = useQuery<JobListItem[], Error>({
    queryKey: [...queryKeys.jobs.lists(), "status", status, limit] as const,
    queryFn: () => fetchJobsByStatus(status, limit),
    staleTime: staleTimes.jobList,
    enabled,
    refetchInterval: autoRefresh ? refreshInterval : false,
    placeholderData: (previousData) => previousData,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    jobs: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
  };
}


export function useActiveJobsCount(): {
  count: number;
  isLoading: boolean;
} {
  const { activeJobsCount, isLoading } = useRecentJobs({
    limit: 20,
    autoRefresh: true,
    refreshInterval: 5000, // Faster refresh for active job count
  });

  return {
    count: activeJobsCount,
    isLoading,
  };
};


export async function prefetchJobs(
  queryClient: ReturnType<typeof useQueryClient>,
  params?: ListJobsParams
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.jobs.list(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => fetchJobs(params),
    staleTime: staleTimes.jobList,
  });
};
