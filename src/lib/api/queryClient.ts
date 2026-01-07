import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { isAxiosError, getErrorMessage } from './axios-client';
import { showErrorToast, showSuccessToast } from '@/components/providers';


export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    status: (id: string) => [...queryKeys.jobs.all, "status", id] as const,
  },

  operations: {
    all: ["operations"] as const,
    lists: () => [...queryKeys.operations.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.operations.lists(), filters] as const,
    details: () => [...queryKeys.operations.all, "detail"] as const,
    detail: (name: string) =>
      [...queryKeys.operations.details(), name] as const,
  },

  health: {
    all: ["health"] as const,
    check: () => [...queryKeys.health.all, "check"] as const,
  },
} as const;


// Default stale time for different data types
export const staleTimes = {
    operations: 5 * 60 * 1000, // 5 minutes
    jobList: 30 * 1000, // 30 seconds
    jobDetail: 15 * 1000, // 15 seconds
    jobStatus: 0,
    health: 60 * 1000, // 60 seconds
} as const;


// Polling intervals for different scenarios
export const pollingIntervals = {
    activeJob: 2 * 1000, // 2 seconds
    jobList: 60 * 1000, // 60 seconds
    health: 30 * 1000, // 30 seconds
} as const;


/**
 * Errors that should NOT trigger a toast notification
 * (e.g., background refetches, polling queries)
 */
const SILENT_ERROR_QUERY_KEYS = [
  'health',
];


function shouldShowErrorToast(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return true;
  
  const firstKey = queryKey[0];
  return !SILENT_ERROR_QUERY_KEYS.includes(firstKey as string);
};


// Error handling for queries and mutations

function handleQueryError(error: unknown, query: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[React Query] Query Error:", error);
  }

  // Type guard for query object
  const queryObj = query as { queryKey?: unknown; meta?: { silent?: boolean } };

  if (queryObj?.meta?.silent) {
    return;
  }

  if (queryObj?.queryKey && !shouldShowErrorToast(queryObj.queryKey)) {
    return;
  }

  const message = getErrorMessage(error);
  showErrorToast(message);
};


function handleMutationError(
  error: unknown,
  _variables: unknown,
  _context: unknown,
  mutation: unknown
): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[React Query] Mutation Error:", error);
  }

  // Type guard for mutation object
  const mutationObj = mutation as {
    meta?: { silent?: boolean; errorMessage?: string };
  };

  if (mutationObj?.meta?.silent) {
    return;
  }

  const message = mutationObj?.meta?.errorMessage || getErrorMessage(error);
  showErrorToast(message);
};


function handleMutationSuccess(
  _data: unknown,
  _variables: unknown,
  _context: unknown,
  mutation: unknown
): void {
  // Type guard for mutation object
  const mutationObj = mutation as { meta?: { successMessage?: string } };

  if (mutationObj?.meta?.successMessage) {
    showSuccessToast(mutationObj.meta.successMessage);
  }
};


function shouldRetryQuery(failureCount: number, error: unknown): boolean { 
    if (failureCount >= 3) return false;

    if (isAxiosError(error) && error.response) { 
        const status = error.response.status;

        // Dont retry for client errors except 408 and 429
        if (status >= 400 && status < 500) { 
            return status === 408 || status === 429;
        }
    };

    return true;
};


// Calculate retry delay with exponential backoff
function getRetryDelay(attemptIndex: number): number { 
    const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
};


export function createQueryClient(): QueryClient {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: handleQueryError,
        }),
        mutationCache: new MutationCache({
            onError: handleMutationError,
            onSuccess: handleMutationSuccess,
        }),
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,
                gcTime: 10 * 60 * 1000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: 'always',
                retry: shouldRetryQuery,
                retryDelay: getRetryDelay,

                networkMode: 'online',
            },
            mutations: {
                retry: 1,
                retryDelay: 1000,
                networkMode: 'online',
            }
        }
    });
};


let browserQueryClient: QueryClient | undefined;

/**
 * Get or create the QueryClient for browser usage
 * 
 * This ensures only one QueryClient instance gets created on the client side,
 * while allowing fresh instances for server-side rendering.
 */
export function getQueryClient(): QueryClient { 
    // server-side always create a new client
    if (typeof window === 'undefined') { 
        return createQueryClient();
    };

    // client-side reuse existing or create new
    if (!browserQueryClient) { 
        browserQueryClient = createQueryClient();
    };

    return browserQueryClient;
};


// Utility functions

export function invalidateJobQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
};


export function invalidateJob(
  queryClient: QueryClient,
  jobId: string
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.jobs.detail(jobId),
  });
};


/**
 * Prefetch operation definitions
 * Called on app load to have operations ready
 */
export async function prefetchOperations(
  queryClient: QueryClient,
  fetchFn: () => Promise<unknown>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.operations.list(),
    queryFn: fetchFn,
    staleTime: staleTimes.operations,
  });
};


/**
 * Set job data in cache (useful for optimistic updates)
 */
export function setJobInCache<T>(
  queryClient: QueryClient,
  jobId: string,
  data: T
): void {
  queryClient.setQueryData(queryKeys.jobs.detail(jobId), data);
};

export function getJobFromCache<T>(
  queryClient: QueryClient,
  jobId: string
): T | undefined {
  return queryClient.getQueryData<T>(queryKeys.jobs.detail(jobId));
};