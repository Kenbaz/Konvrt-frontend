// src/lib/api/download.ts

import { apiClient } from "./axios-client";
import { ApiEndpoints } from "@/types/api-types";
import type { DownloadOptions } from "@/types/api-types";

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  loaded: number;
  total: number;
  error: string | null;
  aborted: boolean;
}

export interface DownloadResult {
  success: boolean;
  filename: string;
  size: number;
  blob: Blob;
  url: string;
}

interface CloudinaryDownloadResponse {
  success: boolean;
  data: {
    download_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_location: "cloudinary" | "local";
  };
  message?: string;
}

export class DownloadError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(
    message: string,
    code: string = "DOWNLOAD_ERROR",
    status: number = 0,
    retryable: boolean = false
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function extractFilenameFromHeader(
  contentDisposition: string | null
): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(
    /filename\*=(?:UTF-8''|utf-8'')(.+?)(?:;|$)/i
  );
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // Ignore decoding errors
    }
  }

  // Try quoted filename
  const quotedMatch = contentDisposition.match(/filename="(.+?)"/i);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // Try unquoted filename
  const unquotedMatch = contentDisposition.match(/filename=([^;\s]+)/i);
  if (unquotedMatch) {
    return unquotedMatch[1];
  }

  return null;
}

function generateFallbackFilename(
  jobId: string,
  contentType: string | null
): string {
  const extension = getExtensionFromMimeType(contentType);
  const timestamp = new Date().toISOString().slice(0, 10);
  return `processed_${jobId.slice(0, 8)}_${timestamp}${extension}`;
}

function getExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) return "";

  const mimeToExtension: Record<string, string> = {
    // Video
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/x-matroska": ".mkv",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",

    // Image
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",

    // Audio
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/aac": ".aac",
    "audio/flac": ".flac",
    "audio/x-m4a": ".m4a",
    "audio/mp4": ".m4a",
    "audio/opus": ".opus",
  };

  return mimeToExtension[mimeType.toLowerCase()] || "";
}

export function createDownloadController(): AbortController {
  return new AbortController();
}


function isCloudinaryResponse(
  contentType: string | null
): boolean {
  return contentType?.includes("application/json") ?? false;
}


async function downloadFromCloudinaryUrl(
  downloadUrl: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
  abortController?: AbortController
): Promise<DownloadResult> {
  try {
    const response = await fetch(downloadUrl, {
      method: "GET",
      signal: abortController?.signal,
    });

    if (!response.ok) {
      throw new DownloadError(
        `Failed to download from Cloudinary: ${response.status}`,
        "CLOUDINARY_DOWNLOAD_FAILED",
        response.status,
        true
      );
    }

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : fileSize;

    if (response.body && onProgress) {
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Convert Uint8Array to ArrayBuffer for BlobPart compatibility
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
        loaded += value.length;
        
        const percentage = total > 0 ? Math.round((loaded / total) * 100) : -1;
        onProgress({ loaded, total, percentage });
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        filename,
        size: blob.size,
        blob,
        url,
      };
    } else {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (onProgress) {
        onProgress({ loaded: blob.size, total: blob.size, percentage: 100 });
      }

      return {
        success: true,
        filename,
        size: blob.size,
        blob,
        url,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new DownloadError(
        "Download was cancelled",
        "DOWNLOAD_CANCELLED",
        0,
        false
      );
    }
    
    if (error instanceof DownloadError) {
      throw error;
    }

    throw new DownloadError(
      "Failed to download from Cloudinary",
      "CLOUDINARY_DOWNLOAD_FAILED",
      0,
      true
    );
  }
}

/**
 * Download a processed file for a completed job
 *
 * Handles both:
 * - Cloudinary storage: Gets JSON with download URL, then downloads from Cloudinary
 * - Local storage: Gets blob directly from the API
 *
 * @param jobId - The job ID to download the output from
 * @param options - Download options including progress callback
 * @param abortController - Optional AbortController for cancellation
 * @returns Promise resolving to DownloadResult
 */
export async function downloadJobOutput(
  jobId: string,
  options: DownloadOptions = {},
  abortController?: AbortController
): Promise<DownloadResult> {
  const { onProgress, filename: customFilename } = options;

  try {
    const response = await apiClient.get(
      ApiEndpoints.OPERATION_DOWNLOAD(jobId),
      {
        signal: abortController?.signal,
        timeout: 30000,
      }
    );

    const contentType = response.headers["content-type"] as string | null;

    if (isCloudinaryResponse(contentType)) {
      const cloudinaryResponse = response.data as CloudinaryDownloadResponse;
      
      if (!cloudinaryResponse.success || !cloudinaryResponse.data?.download_url) {
        throw new DownloadError(
          "Invalid Cloudinary response",
          "INVALID_RESPONSE",
          0,
          true
        );
      }

      const { download_url, file_name, file_size, mime_type } = cloudinaryResponse.data;
      const filename = customFilename || file_name;

      if (process.env.NODE_ENV === "development") {
        console.log("Cloudinary download response:", {
          download_url,
          file_name,
          file_size,
          mime_type,
        });
      }

      // Download from Cloudinary URL
      return await downloadFromCloudinaryUrl(
        download_url,
        filename,
        file_size,
        mime_type,
        onProgress,
        abortController
      );
    }

    // Local storage: response is a blob
    // Re-fetch with blob response type for proper handling
    const blobResponse = await apiClient.get(
      ApiEndpoints.OPERATION_DOWNLOAD(jobId),
      {
        responseType: "blob",
        signal: abortController?.signal,
        timeout: 0,
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const loaded = progressEvent.loaded;
            const total = progressEvent.total;
            const percentage = Math.round((loaded / total) * 100);

            onProgress({
              loaded,
              total,
              percentage,
            });
          } else if (onProgress && progressEvent.loaded) {
            // Total size unknown
            onProgress({
              loaded: progressEvent.loaded,
              total: 0,
              percentage: -1,
            });
          }
        },
      }
    );

    const blob = blobResponse.data as Blob;

    // Determine filename from headers
    const contentDisposition = blobResponse.headers[
      "content-disposition"
    ] as string | null;
    const blobContentType = blobResponse.headers["content-type"] as string | null;

    if (process.env.NODE_ENV === "development") {
      console.log("Local download response headers:", {
        contentDisposition,
        contentType: blobContentType,
        allHeaders: blobResponse.headers,
      });
    }

    let filename = customFilename;
    if (!filename) {
      filename = extractFilenameFromHeader(contentDisposition);
    }
    if (!filename) {
      filename = generateFallbackFilename(jobId, blobContentType);
    }

    const url = URL.createObjectURL(blob);

    return {
      success: true,
      filename,
      size: blob.size,
      blob,
      url,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "CanceledError") {
      throw new DownloadError(
        "Download was cancelled",
        "DOWNLOAD_CANCELLED",
        0,
        false
      );
    }

    if (error instanceof DownloadError) {
      throw error;
    }

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { status: number; data?: unknown };
        message?: string;
      };
      const status = axiosError.response?.status ?? 0;

      switch (status) {
        case 400:
          throw new DownloadError(
            "Job is not complete or has no output file",
            "JOB_NOT_COMPLETE",
            status,
            false
          );
        case 403:
          throw new DownloadError(
            "You don't have permission to download this file",
            "PERMISSION_DENIED",
            status,
            false
          );
        case 404:
          throw new DownloadError(
            "File not found. It may have expired or been deleted",
            "FILE_NOT_FOUND",
            status,
            false
          );
        case 410:
          throw new DownloadError(
            "File has expired and is no longer available",
            "FILE_EXPIRED",
            status,
            false
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new DownloadError(
            "Server error. Please try again later",
            "SERVER_ERROR",
            status,
            true
          );
        default:
          throw new DownloadError(
            axiosError.message ?? "Download failed",
            "DOWNLOAD_FAILED",
            status,
            true
          );
      }
    }

    if (error instanceof Error) {
      throw new DownloadError(
        "Network error. Please check your connection and try again",
        "NETWORK_ERROR",
        0,
        true
      );
    }

    throw new DownloadError(
      "An unexpected error occurred during download",
      "UNKNOWN_ERROR",
      0,
      true
    );
  }
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function revokeDownloadUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Ignore errors when revoking URLs
  }
}

/**
 * Download and trigger browser download in one step
 *
 * This is a convenience function that combines downloadJobOutput
 * and triggerBrowserDownload for the common use case.
 *
 * @param jobId - The job ID to download
 * @param options - Download options
 * @param abortController - Optional AbortController for cancellation
 * @returns Promise resolving to the filename that was downloaded
 */
export async function downloadAndSave(
  jobId: string,
  options: DownloadOptions = {},
  abortController?: AbortController
): Promise<string> {
  const result = await downloadJobOutput(jobId, options, abortController);

  triggerBrowserDownload(result.blob, result.filename);

  // Clean up the object URL
  revokeDownloadUrl(result.url);

  return result.filename;
}

export async function canDownload(jobId: string): Promise<boolean> {
  try {
    // Make a HEAD request to check if download is available
    await apiClient.head(ApiEndpoints.OPERATION_DOWNLOAD(jobId));
    return true;
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${Math.round(size)} ${units[unitIndex]}`;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDownloadProgress(loaded: number, total: number): string {
  if (total <= 0) {
    return formatFileSize(loaded);
  }

  return `${formatFileSize(loaded)} / ${formatFileSize(total)}`;
}