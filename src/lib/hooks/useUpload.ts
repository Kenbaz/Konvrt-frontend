// src/lib/hooks/useUpload.ts

import { useState, useRef, useCallback } from "react";
import {
    uploadAndCreateJob,
    UploadProgress,
    UploadResult,
    isUploadCancelled,
} from "../api/upload";
import type { CreateJobParams, Job } from "@/types";


export type UploadStatus = 'idle' | 'uploading' | 'saving' | 'success' | 'error' | 'cancelled';

export interface UseUploadState {
    status: UploadStatus;
    isUploading: boolean;
    progress: UploadProgress | null;
    error: string | null;
    job: Job | null;
};

export interface UseUploadActions {
    upload: (params: CreateJobParams) => Promise<UploadResult | null>;
    cancel: () => void;
    reset: () => void;
};

export type UseUploadReturn = UseUploadState & UseUploadActions;

export interface UseUploadOptions {
    onUploadStart?: () => void;
    onProgress?: (progress: UploadProgress) => void;
    onSuccess?: (result: UploadResult) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
};

const initialState: UseUploadState = {
    status: 'idle',
    isUploading: false,
    progress: null,
    error: null,
    job: null,
};


export function useUpload(options: UseUploadOptions = {}): UseUploadReturn { 
    const { onUploadStart, onProgress, onSuccess, onError, onCancel } = options;
    
    const [state, setState] = useState<UseUploadState>(initialState);
    const abortControllerRef = useRef<AbortController | null>(null);

    const upload = useCallback(async (params: CreateJobParams): Promise<UploadResult | null> => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        };

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setState({
            status: 'uploading',
            isUploading: true,
            progress: null,
            error: null,
            job: null,
        });

        if (onUploadStart) {
            onUploadStart();
        };

        try {
            const result = await uploadAndCreateJob(params, {
                signal: abortControllerRef.current.signal,
                onProgress: (progress) => {
                    if (progress.percentage >= 100) {
                        setState(prev => ({
                            ...prev,
                            status: 'saving',
                            progress,
                        }));
                    } else {
                        setState(prev => ({ ...prev, progress }));
                    }
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            });

            setState({
                status: 'success',
                isUploading: false,
                progress: state.progress ? { ...state.progress, percentage: 100 } : null,
                error: null,
                job: result.job,
            });

            if (onSuccess) {
                onSuccess(result);
            };

            return result;
        } catch (error) {
            // Handle cancellation
            if (isUploadCancelled(error)) {
                setState({
                    status: "cancelled",
                    isUploading: false,
                    progress: null,
                    error: null,
                    job: null,
                });
                onCancel?.();
                return null;
            }

            // Handle other errors
            const errorMessage =
                error instanceof Error ? error.message : "Upload failed";

            setState({
                status: "error",
                isUploading: false,
                progress: null,
                error: errorMessage,
                job: null,
            });

            if (onError) {
                onError(error instanceof Error ? error : new Error(errorMessage));
            }

            return null;
        };
    }, [onUploadStart, onProgress, onSuccess, onError, onCancel, state.progress]);


    // Cancel ongoing upload
    const cancel = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }, []);

    // Reset state
    const reset = useCallback(() => {
      // Cancel any existing upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setState(initialState);
    }, []);

    return {
        ...state,
        upload,
        cancel,
        reset,
    };
};