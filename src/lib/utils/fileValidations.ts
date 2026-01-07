import type { MediaType } from "@/types";
import { detectMediaType, formatFileSize } from "./fileHelpers";

export const FILE_SIZE_LIMITS: Record<MediaType, number> = {
    video: 500 * 1024 * 1024, // 500 MB
    audio: 100 * 1024 * 1024, // 100 MB
    image: 50 * 1024 * 1024,  // 50 MB
};

export const FILE_SIZE_LIMIT_LABELS: Record<MediaType, string> = {
    video: "500 MB",
    audio: "100 MB",
    image: "50 MB",
};

export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export type FileValidationErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_TYPE"
  | "UNKNOWN_TYPE"
  | "MEDIA_TYPE_MISMATCH"
  | "EMPTY_FILE";

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
  field?: string;
  details?: {
    fileSize?: number;
    maxSize?: number;
    expectedTypes?: MediaType[];
    detectedType?: MediaType | null;
  };
};

export interface FileValidationResult {
  isValid: boolean;
  error?: FileValidationError;
  warnings?: string[];
  mediaType?: MediaType;
  fileSize?: number;
};

export function getMaxFileSize(mediaType: MediaType): number {
    return FILE_SIZE_LIMITS[mediaType] ?? DEFAULT_MAX_FILE_SIZE;
};


export function getMaxFileSizeForTypes(mediaTypes: MediaType[]): number {
  if (mediaTypes.length === 0) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  return Math.max(
    ...mediaTypes.map((type) => FILE_SIZE_LIMITS[type] ?? DEFAULT_MAX_FILE_SIZE)
  );
};


export function getFileSizeLimitLabel(mediaType: MediaType): string {
  return (
    FILE_SIZE_LIMIT_LABELS[mediaType] ?? formatFileSize(DEFAULT_MAX_FILE_SIZE)
  );
};


export function validateFile(
  file: File,
  acceptedMediaTypes?: MediaType[],
  customMaxSize?: number
): FileValidationResult {
  const warnings: string[] = [];

  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        code: "EMPTY_FILE",
        message: "The file is empty. Please select a valid file",
      },
    };
  }

  const detectedType = detectMediaType(file);

  if (!detectedType) {
    return {
      isValid: false,
      error: {
        code: "UNKNOWN_TYPE",
        message: "Could not determine file type. Please select a valid file",
        details: {
          detectedType: null,
        },
      },
    };
  }

  // Check if the detected type is in the accepted types
  if (acceptedMediaTypes && acceptedMediaTypes.length > 0) {
    if (!acceptedMediaTypes.includes(detectedType)) {
      const expectedTypesStr = acceptedMediaTypes.join(", ");
      return {
        isValid: false,
        error: {
          code: "MEDIA_TYPE_MISMATCH",
          message: `Expected a ${expectedTypesStr} file, but got a ${detectedType} file.`,
          details: {
            expectedTypes: acceptedMediaTypes,
            detectedType,
          },
        },
      };
    }
  }

  // Determine max file size
  const maxSize = customMaxSize ?? getMaxFileSize(detectedType);

  if (file.size > maxSize) {
    const fileSizeStr = formatFileSize(file.size);
    const maxSizeStr = formatFileSize(maxSize);

    return {
      isValid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${fileSizeStr}) exceeds the maximum allowed size (${maxSizeStr}) for ${detectedType} files.`,
        field: "file",
        details: {
          fileSize: file.size,
          maxSize,
          detectedType,
        },
      },
      mediaType: detectedType,
      fileSize: file.size,
    };
  }

  // Add warnings for large files that are close to the limit
  const sizePercentage = (file.size / maxSize) * 100;
  if (sizePercentage > 80) {
    warnings.push(
      `File is ${sizePercentage.toFixed(0)}% of the maximum allowed size.`
    );
  }

  return {
    isValid: true,
    mediaType: detectedType,
    fileSize: file.size,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};


export function validateFiles(
  files: File[],
  acceptedMediaTypes?: MediaType[],
  customMaxSize?: number
): Map<File, FileValidationResult> {
  const results = new Map<File, FileValidationResult>();

  for (const file of files) {
    results.set(file, validateFile(file, acceptedMediaTypes, customMaxSize));
  }

  return results;
};


export function getValidationErrorMessage(result: FileValidationResult): string | null {
  if (result.isValid || !result.error) {
    return null;
  }
  return result.error.message;
};


export function getFileRequirementsHint(
    acceptedMediaTypes: MediaType[],
    customMaxSize?: number
): string {
    const parts: string[] = [];

    if (acceptedMediaTypes.length === 1) {
        const type = acceptedMediaTypes[0];
        const maxSize = customMaxSize ?? getMaxFileSize(type);
        parts.push(`Maximum ${type} file size: ${formatFileSize(maxSize)}`);
    } else if (acceptedMediaTypes.length > 1) { 
        parts.push("Maximum file sizes:");
        for (const type of acceptedMediaTypes) { 
            const maxSize = customMaxSize ?? getMaxFileSize(type);
            parts.push(`  • ${type}: ${formatFileSize(maxSize)}`);
        }
    };

    return parts.join("\n");
};


export interface ApiValidationError {
  field: string;
  message: string;
}

export interface ParsedApiError {
  code: string;
  message: string;
  errors: ApiValidationError[];
}

export function parseApiValidationErrors(responseData: unknown): ParsedApiError | null {
  if (!responseData || typeof responseData !== "object") {
    return null;
  }
  
  const data = responseData as Record<string, unknown>;
  
  // Check for error object
  const errorObj = data.error as Record<string, unknown> | undefined;
  if (!errorObj || typeof errorObj !== "object") {
    return null;
  }
  
  const code = (errorObj.code as string) ?? "UNKNOWN_ERROR";
  const message = (errorObj.message as string) ?? "An error occurred";
  const rawErrors = errorObj.errors as Array<{ field?: string; message?: string }> | undefined;
  
  const errors: ApiValidationError[] = [];
  if (Array.isArray(rawErrors)) {
    for (const err of rawErrors) {
      if (err && typeof err === "object" && err.message) {
        errors.push({
          field: err.field ?? "unknown",
          message: err.message,
        });
      }
    }
  }
  
  return { code, message, errors };
};


/**
 * Format API validation errors into a user-friendly message
 */
export function formatApiValidationErrors(parsedError: ParsedApiError): string {
  if (parsedError.errors.length === 0) {
    return parsedError.message;
  }
  
  if (parsedError.errors.length === 1) {
    return parsedError.errors[0].message;
  }
  
  // Multiple errors - format as a list
  const errorMessages = parsedError.errors.map(e => e.message);
  return errorMessages.join(" ");
};


/**
 * Check if an error is a file size validation error
 */
export function isFileSizeError(error: FileValidationError | ParsedApiError): boolean {
  if ("code" in error) {
    return error.code === "FILE_TOO_LARGE" || error.code === "VALIDATION_ERROR";
  }
  return false;
};