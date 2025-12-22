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