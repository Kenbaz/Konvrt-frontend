// src/lib/api/jobs.ts

import { apiClient, getErrorMessage } from "./axios-client";
import { ApiEndpoints } from "@/types/api-types";
import type {
    Job,
    JobListItem,
    JobStatus,
    DeleteJobResponse,
    ListJobsParams,
    PaginatedResponse
} from "@/types";

interface ApiSuccessResponse<T> { 
    success: true;
    data: T;
    message?: string;
    metadata?: {
        total_count?: number;
        [key: string]: unknown;
    };
};


function extractData<T>(response: { data: ApiSuccessResponse<T> | T }): T {
    const data = response.data;
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
        return (data as ApiSuccessResponse<T>).data;
    };
    return data as T;
};


export async function fetchJobs(
    params?: ListJobsParams
): Promise<PaginatedResponse<JobListItem>> {
    const response = await apiClient.get<
      | ApiSuccessResponse<PaginatedResponse<JobListItem>>
      | PaginatedResponse<JobListItem>
        >(ApiEndpoints.OPERATIONS, { params });
    
    const data = response.data;

    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      "success" in data
    ) {
      return (data as ApiSuccessResponse<PaginatedResponse<JobListItem>>).data;
    };

    return data as PaginatedResponse<JobListItem>;
};


export async function fetchJob(jobId: string): Promise<Job> {
    const response = await apiClient.get<ApiSuccessResponse<Job> | Job>(
        ApiEndpoints.OPERATION_DETAIL(jobId)
    );

    return extractData<Job>(response);
};


export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
    const response = await apiClient.get<ApiSuccessResponse<JobStatus> | JobStatus>(
        ApiEndpoints.OPERATION_STATUS(jobId)
    );

    return extractData<JobStatus>(response);
};


export async function deleteJob(jobId: string): Promise<DeleteJobResponse> { 
    const response = await apiClient.delete<ApiSuccessResponse<null> | { success: boolean;  message: string}>(ApiEndpoints.OPERATION_DETAIL(jobId));

    const data = response.data;

    if (data && typeof data === "object" && "success" in data) {
      return {
        success: true,
        message:
          (data as { message?: string }).message || "Job deleted successfully",
      };
    }

    return { success: true, message: "Job deleted successfully" };
};


export async function retryJob(jobId: string): Promise<Job> {
  const response = await apiClient.post<ApiSuccessResponse<Job> | Job>(
    ApiEndpoints.OPERATION_RETRY(jobId)
  );

  return extractData<Job>(response);
};


export async function cancelJob(
  jobId: string
): Promise<{ success: boolean; message: string }> {
  const cancelUrl = `/operations/${jobId}/cancel/`;
  const response = await apiClient.post<
    ApiSuccessResponse<null> | { success: boolean; message: string }
  >(cancelUrl);

  const data = response.data;

  if (data && typeof data === "object" && "success" in data) {
    return {
      success: true,
      message: (data as { message?: string }).message || "Job cancelled successfully",
    };
  }

  return { success: true, message: "Job cancelled successfully" };
};


export async function fetchAllJobs(
  params?: Omit<ListJobsParams, "page" | "page_size">,
  maxPages: number = 5
): Promise<JobListItem[]> {
  const allJobs: JobListItem[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const response = await fetchJobs({
      ...params,
      page: currentPage,
      page_size: 50,
    });

    allJobs.push(...response.results);

    hasMore = response.next !== null;
    currentPage++;
  }

  return allJobs;
};


export async function fetchRecentJobs(
  limit: number = 10
): Promise<JobListItem[]> {
  const response = await fetchJobs({
    page_size: limit,
    ordering: "-created_at",
  });

  return response.results;
};


export async function fetchJobsByStatus(
  status: string,
  limit: number = 20
): Promise<JobListItem[]> {
  const response = await fetchJobs({
    status,
    page_size: limit,
  });

  return response.results;
};


export async function isJobComplete(jobId: string): Promise<boolean> {
  const status = await fetchJobStatus(jobId);
  return status.is_complete;
};


export async function pollJobUntilComplete(
  jobId: string,
  options: {
    interval?: number;
    maxAttempts?: number;
    onProgress?: (status: JobStatus) => void;
  } = {}
): Promise<JobStatus> {
  const { interval = 2000, maxAttempts = 300, onProgress } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await fetchJobStatus(jobId);

    onProgress?.(status);

    if (status.is_complete) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error("Job polling timed out");
};


export class JobError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = "JOB_ERROR", status: number = 0) {
    super(message);
    this.name = "JobError";
    this.code = code;
    this.status = status;
  }
};


export async function safeJobOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = "Job operation failed"
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const message = getErrorMessage(error);
    return { success: false, error: message || errorMessage };
  }
};