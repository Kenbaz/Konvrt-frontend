// src/lib/api/upload.ts

import axios, { AxiosProgressEvent } from "axios";
import { apiClient, UPLOAD_TIMEOUT, parseApiError, isAxiosError } from "./axios-client";
import { Job, CreateJobParams } from "@/types";


export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
    estimatedTimeRemaining: number | null;
    bytesPerSecond: number;
};

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface UploadState {
    isUploading: boolean;
    progress: UploadProgress | null;
    error: string | null;
    cancel: (() => void) | null;
};

export interface UploadResult {
    job: Job;
    message: string;
};

export interface UploadOptions {
    onProgress?: UploadProgressCallback;
    signal?: AbortSignal;
};


export function createJobFormData(params: CreateJobParams): FormData { 
    const formData = new FormData();

    formData.append('operation', params.operation);
    formData.append('parameters', JSON.stringify(params.parameters));
    formData.append('file', params.file);

    return formData;
};


// Calculate upload progress with speed and ETA
function calculateProgress(
    event: AxiosProgressEvent,
    startTime: number
): UploadProgress { 
    const loaded = event.loaded;
    const total = event.total ?? 0;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

    // Calculate speed
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const bytesPerSecond = elapsedSeconds > 0 ? loaded / elapsedSeconds : 0;

    // Estimate time remaining
    let estimatedTimeRemaining: number | null = null;
    if (bytesPerSecond > 0 && total > 0) { 
        const remainingBytes = total - loaded;
        estimatedTimeRemaining = Math.ceil(remainingBytes / bytesPerSecond);
    };

    return {
        loaded,
        total,
        percentage,
        estimatedTimeRemaining,
        bytesPerSecond
    };
};


/**
 * Upload a file and create a job
 * 
 * @param params - Job creation parameters (operation, parameters, file)
 * @param options - Upload options (progress callback, abort signal)
 * @returns Promise resolving to the created job
 */
export async function uploadAndCreateJob(
    params: CreateJobParams,
    options: UploadOptions = {}
): Promise<UploadResult> { 
    const {onProgress, signal} = options;
    const startTime = Date.now();

    const formData = createJobFormData(params);

    const cancelTokenSource = axios.CancelToken.source();

    if (signal) {
        signal.addEventListener('abort', () => {
            cancelTokenSource.cancel('Upload cancelded by user');
        });
    };

    try {
        const response = await apiClient.post<{
            success: boolean;
            data: Job;
            message: string;
        }>('/operations/', formData, {
            timeout: UPLOAD_TIMEOUT,
            cancelToken: cancelTokenSource.token,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (event: AxiosProgressEvent) => {
                const progress = calculateProgress(event, startTime);
                if (onProgress) {
                    onProgress(progress);
                }
            }
        });

        return {
            job: response.data.data,
            message: response.data.message || 'Job created successfully',
        };
    } catch (error) { 
        // Handle cancellation
        if (axios.isCancel(error)) { 
            throw new UploadCancelledError('Upload was cancelled');
        };

        // Handle abort signal
        if (signal?.aborted) { 
            throw new UploadCancelledError('Upload was cancelled');
        };

        // Parse API errors
        if (isAxiosError(error)) { 
            const parsed = parseApiError(error);
            throw new UploadError(
                parsed.message, 
                parsed.code, 
                parsed.status,
                parsed.validationErrors
            );
        };

        // Unknown error
        throw new UploadError(
            error instanceof Error ? error.message : 'Upload failed', 'UNKNOWN_ERROR', 0
        );
    };
};


/**
 * Upload controller for managing upload state
 * 
 * This provides a more structured way to manage uploads with
 * built-in state tracking and cancellation.
 */
export function createUploadController() {
    let abortController: AbortController | null = null;
    let state: UploadState = {
        isUploading: false,
        progress: null,
        error: null,
        cancel: null,
    };

    const listerners: Set<(state: UploadState) => void> = new Set();

    function updateState(updates: Partial<UploadState>) {
        state = { ...state, ...updates };
        listerners.forEach((listener) => listener(state));
    };

    return {
        // Get current upload state
        getState(): UploadState {
            return state;
        },

        // Subscribe to state changes
        subscribe(listerner: (state: UploadState) => void): () => void {
            listerners.add(listerner);
            return () => listerners.delete(listerner);
        },

        // Start an upload
        async upload(params: CreateJobParams): Promise<UploadResult> {
            if (abortController) {
                abortController.abort();
            };

            // Create new abort controller
            abortController = new AbortController();

            updateState({
                isUploading: true,
                progress: null,
                error: null,
                cancel: () => abortController?.abort(),
            });

            try {
                const result = await uploadAndCreateJob(params, {
                    signal: abortController.signal,
                    onProgress: (progress) => {
                        updateState({ progress });
                    }
                });

                updateState({
                    isUploading: false,
                    progress: { ...state.progress!, percentage: 100 },
                    cancel: null,
                });

                return result;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Upload failed";

                updateState({
                    isUploading: false,
                    error: errorMessage,
                    cancel: null,
                });

                throw error;
            };
        },

        // Cancel ongoing upload
        reset() {
            if (abortController) {
                abortController.abort();
                abortController = null;
            }

            state = {
                isUploading: false,
                progress: null,
                error: null,
                cancel: null,
            };

            listerners.forEach((listener) => listener(state));
        }
    };
};


export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class UploadError extends Error {
  code: string;
  status: number;
  validationErrors: ValidationErrorDetail[];
  isValidationError: boolean;

  constructor(
    message: string, 
    code: string, 
    status: number,
    validationErrors: ValidationErrorDetail[] = []
  ) {
    super(message);
    this.name = "UploadError";
    this.code = code;
    this.status = status;
    this.validationErrors = validationErrors;
    this.isValidationError = code === 'VALIDATION_ERROR' || status === 400;
  }
  
  
  getDisplayMessage(): string {
    if (this.validationErrors.length > 0) {
      return this.validationErrors[0].message;
    }
    return this.message;
  };
  
  
  getAllValidationMessages(): string {
    if (this.validationErrors.length === 0) {
      return this.message;
    }
    return this.validationErrors.map(e => e.message).join(' ');
  }
};


export class UploadCancelledError extends Error {
  constructor(message: string = "Upload was cancelled") {
    super(message);
    this.name = "UploadCancelledError";
  }
};


export function isUploadCancelled(error: unknown): error is UploadCancelledError {
  return error instanceof UploadCancelledError;
};


export function isUploadError(error: unknown): error is UploadError {
  return error instanceof UploadError;
};


export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
};


export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) {
    return 'Calculating...';
  }
  
  if (seconds < 60) {
    return `${seconds}s remaining`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s remaining`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }
};