import type { Nullable, ISODateString } from "./common-types";
import type { Job, JobListItem, JobStatus } from "./job-types";
import type { OperationDefinition, OperationDefinitionListItem } from "./operation-types";

// Pagination types
export interface PaginatedResponse<T> { 
    count: number;
    next: Nullable<string>;
    previous: Nullable<string>;
    results: T[];
};

export interface PaginationParams {
    page?: number;
    page_size?: number;
};

// Job API Types
export interface ListJobsParams extends PaginationParams { 
    status?: string;
    operation?: string;
    ordering?: string;
};

export type JobListResponse = PaginatedResponse<JobListItem>;

export type JobResponse = Job;

export type JobStatusResponse = JobStatus;

export type CreateJobResponse = Job;


// Operation API Types

export interface ListOperationParams {
    media_type?: string;
};

export type OperationListResponse = OperationDefinitionListItem[];

export type OperationDetailResponse = OperationDefinition;

export type OperationsResponse = OperationDefinition[];


// Health Check types
export interface ServiceStatus {
  status:
    | "connected"
    | "disconnected"
    | "available"
    | "unavailable"
    | "ok"
    | "error";

  message?: string;
  latency_ms?: number;
};

export interface QueueStats {
    queue_name: string;
    queued: number;
    started: number;
    failed: number;
    workers: number;
};

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: ISODateString;
  version: string;
  database: ServiceStatus;
  redis: ServiceStatus;
  storage: ServiceStatus;
  queues: Record<string, QueueStats>;
};


// Error response types

export interface ApiError {
    error?: string;
    message?: string;
    detail?: string;
    errors?: Record<string, string[]>;
    code?: string;
    status?: number;
};

export interface ValidationError {
    [field: string]: string[];
};

// File download types

export type DownloadProgressCallback = (progress: {
    loaded: number;
    total: number;
    percentage: number;
}) => void;

export interface DownloadOptions {
    onProgress?: DownloadProgressCallback;
    filename?: string | null;
};

// API Urls types
export const ApiEndpoints = {
    HEALTH: '/health/',

    OPERATIONS: '/operations/',
    OPERATION_DETAIL: (id: string) => `/operations/${id}/`,
    OPERATION_STATUS: (id: string) => `/operations/${id}/status/`,
    OPERATION_DOWNLOAD: (id: string) => `/operations/${id}/download/`,
    OPERATION_RETRY: (id: string) => `/operations/${id}/retry/`,

    OPERATION_DEFINITIONS: '/operation-definitions/',
    OPERATION_DEFINITION_DETAIL: (name: string) => `/operation-definitions/${name}/`,
} as const;


// Type guards for API responses

export function isPaginatedResponse<T>(
  response: unknown
): response is PaginatedResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "count" in response &&
    "results" in response &&
    Array.isArray((response as PaginatedResponse<T>).results)
  );
};

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === "object" &&
    response !== null &&
    ("error" in response ||
      "message" in response ||
      "detail" in response ||
      "errors" in response)
  );
};