// src/types/job-types.ts

import type {
    UUID,
    ISODateString,
    Nullable,
    OperationStatus,
    FileType,
    JsonObject
 } from "./common-types";

// Job-related types

export interface JobFile {
    id: UUID;
    file_type: FileType;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: ISODateString;
    file_size_formatted: string;
    download_url: string;
};

export interface Job { 
    id: UUID;
    operation: string;
    status: OperationStatus;
    progress: number;
    parameters: JsonObject;
    error_message: Nullable<string>;
    created_at: ISODateString;
    started_at: Nullable<ISODateString>;
    completed_at: Nullable<ISODateString>;
    expires_at: Nullable<ISODateString>;
    processing_time: Nullable<number>; // in seconds
    processing_time_formatted: Nullable<string>;
    is_expired: boolean;
    is_processing: boolean;
    can_be_deleted: boolean;
    input_file: Nullable<JobFile>;
    output_file: Nullable<JobFile>;
};

export interface JobListItem {
    id: UUID;
    operation: string;
    status: OperationStatus;
    progress: number;
    created_at: ISODateString;
    completed_at: Nullable<ISODateString>;
    is_expired: boolean;
    has_output: boolean;
};

export interface JobStatus {
    id: UUID;
    status: OperationStatus;
    progress: number;
    error_message: Nullable<string>;
    eta_seconds: Nullable<number>;
    is_complete: boolean;
    has_output: boolean;
};


// Job creation types

export interface CreateJobRequest { 
    operation: string;
    parameters: string;
    file: File;
};

export interface CreateJobParams {
    operation: string;
    parameters: JsonObject;
    file: File;
};


// Job Action types

export interface DeleteJobResponse { 
    success: boolean;
    message: string;
};

export interface RetryJobResponse { 
    job: Job;
    message: string;
};


// Type guards

export function hasDownloadableOutput(job: Job | JobListItem): boolean { 
    if ('has_output' in job) { 
        return job.has_output && job.status === 'completed';
    };
    return (
      job.status === "completed" &&
      "output_file" in job &&
      job.output_file !== null
    );
};

export function isJobActive(job: Job | JobListItem | JobStatus): boolean {
  return (
    job.status === "pending" ||
    job.status === "queued" ||
    job.status === "processing"
  );
};

export function isJobFailed(job: Job | JobListItem | JobStatus): boolean {
  return job.status === "failed";
};

export function shouldPollJob(job: Job | JobListItem | JobStatus): boolean {
  return isJobActive(job);
};