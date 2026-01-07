// src/lib/hooks/useCreateJob.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { 
    uploadAndCreateJob,
    UploadProgress,
    UploadResult,
    isUploadCancelled,
    isUploadError
} from "../api";
import type { UploadStatus } from "./useUpload";
import { queryKeys } from "../api/queryClient";
import type { Job, CreateJobParams, JsonObject } from "@/types";

export interface CreateJobInput {
    operation: string;
    parameters: JsonObject;
    file: File;
};

export interface CreateJobState {
  isCreating: boolean;
  isUploading: boolean;
  uploadStatus: UploadStatus;
  progress: UploadProgress | null;
  error: string | null;
  createdJob: Job | null;
};

export interface CreateJobResult {
  job: Job;
  message: string;
};

export interface UseCreateJobOptions {
    onStart?: () => void;
    onProgress?: (progress: UploadProgress) => void;
    onSuccess?: (result: CreateJobResult) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
    invalidateJobsOnSuccess?: boolean;
};

export interface UseCreateJobReturn extends CreateJobState { 
    createJob: (input: CreateJobInput) => Promise<CreateJobResult | null>;
    cancel: () => void;
    reset: () => void;
    isIdle: boolean;
    isSuccess: boolean;
};


export function useCreateJob(
  options: UseCreateJobOptions = {}
): UseCreateJobReturn {
  const {
    onStart,
    onProgress,
    onSuccess,
    onError,
    onCancel,
    invalidateJobsOnSuccess = true,
  } = options;

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');

  
  const mutation = useMutation<
    UploadResult,
    Error,
    CreateJobParams,
    { previousJobs?: unknown }
  >({
    mutationFn: async (params: CreateJobParams) => {
      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();

      setIsUploading(true);
      setUploadStatus('uploading');
      setProgress(null);
      onStart?.();

      try {
        const result = await uploadAndCreateJob(params, {
          signal: abortControllerRef.current.signal,
          onProgress: (uploadProgress) => {
            setProgress(uploadProgress);
            if (uploadProgress.percentage >= 100) {
              setUploadStatus('saving');
            }
            onProgress?.(uploadProgress);
          },
        });

        return result;
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },

    onSuccess: (result) => {
      // Set progress to 100% and status to success
      setProgress((prev) => (prev ? { ...prev, percentage: 100 } : null));
      setUploadStatus('success');

      // Invalidate jobs list to refresh
      if (invalidateJobsOnSuccess) {
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      }

      onSuccess?.({ job: result.job, message: result.message });
    },

    onError: (error) => {
      setProgress(null);

      if (isUploadCancelled(error)) {
        setUploadStatus('cancelled');
        onCancel?.();
        return;
      }

      setUploadStatus('error');
      onError?.(error);
    },
  });

  
  const createJob = useCallback(
    async (input: CreateJobInput): Promise<CreateJobResult | null> => {
      try {
        const result = await mutation.mutateAsync({
          operation: input.operation,
          parameters: input.parameters,
          file: input.file,
        });

        return {
          job: result.job,
          message: result.message,
        };
      } catch (error) {
        if (isUploadCancelled(error)) {
          return null;
        }

        return null;
      }
    },
    [mutation]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadStatus('cancelled');
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    cancel();
    mutation.reset();
    setProgress(null);
    setIsUploading(false);
    setUploadStatus('idle');
  }, [cancel, mutation]);

  // Derive error message
  const errorMessage = mutation.error
    ? isUploadError(mutation.error)
      ? mutation.error.message
      : mutation.error.message || "Failed to create job"
    : null;

  return {
    // State
    isCreating: mutation.isPending,
    isUploading,
    uploadStatus,
    progress,
    error: errorMessage,
    createdJob: mutation.data?.job ?? null,

    // Derived state
    isIdle: mutation.isIdle,
    isSuccess: mutation.isSuccess,

    // Actions
    createJob,
    cancel,
    reset,
  };
};


export function useCreateJobMutation() {
  const queryClient = useQueryClient();

  return useMutation<UploadResult, Error, CreateJobParams>({
    mutationFn: (params) => uploadAndCreateJob(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
};