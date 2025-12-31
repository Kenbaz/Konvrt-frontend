// src/lib/hooks/useDownload.ts

import { useState, useRef, useEffect, useCallback } from "react";
import {
    downloadJobOutput,
    triggerBrowserDownload,
    revokeDownloadUrl,
    createDownloadController,
    DownloadError,
} from "../api/download";
import type { DownloadResult } from "../api/download";
import type { DownloadOptions } from "@/types/api-types";

export type DownloadStatus =
  | "idle"
  | "downloading"
  | "completed"
  | "error"
  | "cancelled";

export interface DownloadProgress {
    loaded: number;
    total: number;
    percentage: number;
};

export interface UseDownloadState { 
    status: DownloadStatus;
    progress: DownloadProgress;
    error: DownloadError | null;
    result: DownloadResult | null;
};

export interface UseDownloadOptions {
    filename?: string;
    autoSave?: boolean;
    onStart?: () => void;
    onComplete?: (result: DownloadResult) => void;
    onError?: (error: DownloadError) => void;
    onCancel?: () => void;
};

export interface UseDownloadReturn {
    state: UseDownloadState;
    download: (jobId: string, options?: DownloadOptions) => Promise<DownloadResult | null>;
    cancel: () => void;
    retry: () => Promise<DownloadResult | null>;
    redownload: () => void;
    reset: () => void;
    isDownloading: boolean;
    isCompleted: boolean;
    isError: boolean;
    isCancelled: boolean;
    canRetry: boolean;
};

const INITIAL_PROGRESS: DownloadProgress = {
    loaded: 0,
    total: 0,
    percentage: 0,
};

const INITIAL_STATE: UseDownloadState = {
    status: "idle",
    progress: INITIAL_PROGRESS,
    error: null,
    result: null,
};


export function useDownload(options: UseDownloadOptions = {}): UseDownloadReturn {
  const {
    filename: defaultFilename,
    autoSave = true,
    onStart,
    onComplete,
    onError,
    onCancel,
  } = options;

  const [state, setState] = useState<UseDownloadState>(INITIAL_STATE);

  // Refs for tracking current operation
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastJobIdRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<DownloadOptions | undefined>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (state.result) {
        revokeDownloadUrl(state.result.url);
      }
    };
  }, [state.result]);

  // Download function
  const download = useCallback(
    async (
      jobId: string,
      downloadOptions: DownloadOptions = {}
    ): Promise<DownloadResult | null> => {
      lastJobIdRef.current = jobId;
      lastOptionsRef.current = downloadOptions;

      // Reset state and start download
      setState({
        status: "downloading",
        progress: INITIAL_PROGRESS,
        error: null,
        result: null,
      });

      abortControllerRef.current = createDownloadController();

      onStart?.();

      try {
        const result = await downloadJobOutput(
          jobId,
          {
            filename: downloadOptions.filename || defaultFilename,
            onProgress: (progress) => {
              setState((prev) => ({
                ...prev,
                progress: {
                  loaded: progress.loaded,
                  total: progress.total,
                  percentage: progress.percentage,
                },
              }));
              downloadOptions.onProgress?.(progress);
            },
          },
          abortControllerRef.current
        );

        if (autoSave) {
          triggerBrowserDownload(result.blob, result.filename);
        }

        setState({
          status: "completed",
          progress: {
            loaded: result.size,
            total: result.size,
            percentage: 100,
          },
          error: null,
          result,
        });

        onComplete?.(result);
        return result;
      } catch (error) {
        // Handle cancellation
        if (
          error instanceof DownloadError &&
          error.code === "DOWNLOAD_CANCELLED"
        ) {
          setState((prev) => ({
            ...prev,
            status: "cancelled",
            error: error,
          }));
          onCancel?.();
          return null;
        }

        // Handle other errors
        const downloadError =
          error instanceof DownloadError
            ? error
            : new DownloadError(
                error instanceof Error ? error.message : "Download failed",
                "UNKNOWN_ERROR",
                0,
                true
              );

        setState((prev) => ({
          ...prev,
          status: "error",
          error: downloadError,
        }));

        onError?.(downloadError);
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [defaultFilename, autoSave, onStart, onComplete, onError, onCancel]
  );

  // Cancel function
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Retry function
  const retry = useCallback(async (): Promise<DownloadResult | null> => {
    if (!lastJobIdRef.current) return null;
    return download(lastJobIdRef.current, lastOptionsRef.current || {});
  }, [download]);

  // Re-download function (for completed downloads)
  const redownload = useCallback(() => {
    if (state.result) {
      triggerBrowserDownload(state.result.blob, state.result.filename);
    } else if (lastJobIdRef.current) {
      download(lastJobIdRef.current, lastOptionsRef.current || {});
    }
  }, [state.result, download]);

  // Reset function
  const reset = useCallback(() => {
    // Cancel any in-progress download
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Revoke old URL
    if (state.result) {
      revokeDownloadUrl(state.result.url);
    }

    setState(INITIAL_STATE);
  }, [state.result]);
  
  return {
    state,
    download,
    cancel,
    retry,
    redownload,
    reset,
    isDownloading: state.status === "downloading",
    isCompleted: state.status === "completed",
    isError: state.status === "error",
    isCancelled: state.status === "cancelled",
    canRetry:
      (state.status === "error" && state.error?.retryable) ||
      state.status === "cancelled",
  };
};


export interface UseJobDownloadOptions extends UseDownloadOptions { 
    autoStart?: boolean;
    enabled?: boolean;
};

export interface UseJobDownloadReturn extends UseDownloadReturn { 
    startDownload: () => Promise<DownloadResult | null>;
};

export function useJobDownload(
    jobId: string | null | undefined,
    options: UseJobDownloadOptions = {}
): UseJobDownloadReturn {
  const { autoStart = false, enabled = true, ...downloadOptions } = options;

  const downloadHook = useDownload(downloadOptions);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (autoStart && enabled && jobId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      downloadHook.download(jobId);
    }
  }, [autoStart, enabled, jobId, downloadHook]);

  // Reset auto-start flag when jobId changes
  useEffect(() => {
    hasStartedRef.current = false;
  }, [jobId]);

  // Bound download function
  const startDownload =
    useCallback(async (): Promise<DownloadResult | null> => {
      if (!jobId) return null;
      return downloadHook.download(jobId);
    }, [jobId, downloadHook]);

  return {
    ...downloadHook,
    startDownload,
  };
}