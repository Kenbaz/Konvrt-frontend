// src/lib/api/index.ts

// Axios client and utilities
export {
    apiClient,
    parseApiError,
    isAxiosError,
    getErrorMessage,
    UPLOAD_TIMEOUT
} from './axios-client';

export type { ApiErrorResponse, ParsedApiError } from './axios-client';

// Health check APIs
export {
    checkHealth,
    testConnection,
    waitForBackend,
    checkServices,
    ping,
} from './health';

export type { HealthCheckResponse, ConnectionStatus } from './health';

// Upload API
export {
  uploadAndCreateJob,
  createJobFormData,
  createUploadController,
  formatUploadSpeed,
  formatTimeRemaining,
  UploadError,
  UploadCancelledError,
  isUploadCancelled,
  isUploadError,
} from './upload';

export type {
  UploadProgress,
  UploadProgressCallback,
  UploadState,
  UploadResult,
  UploadOptions,
} from './upload';

// Jobs
export {
  fetchJobs,
  fetchJob,
  fetchJobStatus,
  deleteJob,
  retryJob,
  cancelJob,
  fetchAllJobs,
  fetchRecentJobs,
  fetchJobsByStatus,
  isJobComplete,
  pollJobUntilComplete,
  JobError,
  safeJobOperation,
} from "./jobs";

// Query client utilities
export {
  queryKeys,
  staleTimes,
  pollingIntervals,
  createQueryClient,
  getQueryClient,
  invalidateJobQueries,
  invalidateJob,
  prefetchOperations,
  setJobInCache,
  getJobFromCache,
} from "./queryClient";