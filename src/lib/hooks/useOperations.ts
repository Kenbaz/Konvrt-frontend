import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "../api/queryClient";
import {
    fetchOperations,
    fetchOperationDetail,
    fetchGroupedOperations,
    fetchOperationsByMediaType
} from "../api/operations";
import type {
    OperationDefinition,
    GroupedOperations,
    MediaType
} from "@/types";


// Fetch all available operations
export function useOperations() { 
    return useQuery<OperationDefinition[], Error>({
        queryKey: queryKeys.operations.list(),
        queryFn: () => fetchOperations(),
        staleTime: staleTimes.operations,
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};


/**
 * Hook to fetch operations grouped by media type.
 * 
 * Returns operations organized into video, image, and audio categories,
 * which is useful for displaying operations in a grouped UI.
 */
export function useGroupedOperations() { 
    return useQuery<GroupedOperations, Error>({
        queryKey: [...queryKeys.operations.list(), 'grouped'],
        queryFn: fetchGroupedOperations,
        staleTime: staleTimes.operations,
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};


// Fetch operations for a specific media type
export function useOperationsByMediaType(
    mediaType: MediaType,
    options?: { enabled?: boolean }
) {
    return useQuery<OperationDefinition[], Error>({
        queryKey: queryKeys.operations.list({ media_type: mediaType }),
        queryFn: () => fetchOperationsByMediaType(mediaType),
        staleTime: staleTimes.operations,
        gcTime: 10 * 60 * 1000,
        enabled: options?.enabled ?? true,
    });
};


/**
 * Hook to fetch a single operation definition by name.
 * 
 * Used when in need of full parameter schema for a specific operation.
 * 
 * @param operationName - The unique name of the operation
 * @param options - Additional options
 * @param options.enabled - Whether to enable the query (default: true if operationName is provided)
 */
export function useOperationDetail(
    operationName: string | null | undefined,
    options?: { enabled?: boolean }
) {
    return useQuery<OperationDefinition, Error>({
        queryKey: queryKeys.operations.detail(operationName ?? ''),
        queryFn: () => {
            if (!operationName) {
                throw new Error("Operation name is required");
            };
            return fetchOperationDetail(operationName);
        },
        staleTime: staleTimes.operations,
        gcTime: 10 * 60 * 1000,
        enabled: (options?.enabled ?? true) && !!operationName,
    });
};


/**
 * Hook to prefetch operations data.
 * 
 * Call to preload operations into the cache before they're needed.
 * Useful for optimistic UI loading.
 */
export function usePrefetchOperations() { 
    const queryClient = useQueryClient();

    return async () => {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.operations.list(),
            queryFn: () => fetchOperations(),
            staleTime: staleTimes.operations,
        });
    };
};


// Get operation from cache without fetching
export function useOperationFromCache(
    operationName: string | null | undefined
): OperationDefinition | undefined { 
    const queryClient = useQueryClient();

    if (!operationName) return undefined;

    // First check the detailed query
    const directCache = queryClient.getQueryData<OperationDefinition>(
        queryKeys.operations.detail(operationName)
    );

    if (directCache) { 
        return directCache;
    };

    // Fallback to searching in the list cache
    const listCache = queryClient.getQueryData<OperationDefinition[]>(
        queryKeys.operations.list()
    );

    if (listCache) { 
        return listCache.find(op => op.operation_name === operationName);
    };

    return undefined;
};


export function useInvalidateOperations() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.operations.all,
    });
  };
};


export function hasOperations(
  data: OperationDefinition[] | undefined
): data is OperationDefinition[] {
  return Array.isArray(data) && data.length > 0;
};


export function hasGroupedOperations(
  data: GroupedOperations | undefined
): data is GroupedOperations {
  return (
    data !== undefined &&
    (data.video.length > 0 || data.image.length > 0 || data.audio.length > 0)
  );
};