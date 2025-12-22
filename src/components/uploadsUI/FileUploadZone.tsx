// src/components/uploadsUI/FileUploadZone.tsx

"use client";

import { useCallback, useState, useMemo } from "react";
import { useDropzone, FileRejection, DropzoneOptions } from "react-dropzone";
import { Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { FilePreview } from "./Filepreview";
import {
  buildDropZoneAcceptObject as buildDropzoneAccept,
  detectMediaType,
  formatFileSize,
  getAcceptedTypesDescription,
  getAcceptedExtensions,
} from "@/lib/utils/fileHelpers";
import type { MediaType } from "@/types/common-types";


const MAX_FILE_SIZES: Record<MediaType, number> = {
  video: 500 * 1024 * 1024, // 500 MB
  image: 50 * 1024 * 1024, // 50 MB
  audio: 100 * 1024 * 1024, // 100 MB
};

// Default max file size if media type is unknown
const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileClear?: () => void;
  selectedFile?: File | null;
  acceptedMediaTypes?: MediaType[];
  acceptedFormats?: string[];
  maxFileSize?: number;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
  placeholder?: string;
  error?: string | null;
};

interface FileError {
  message: string;
  code: string;
};


export function FileUploadZone({
  onFileSelect,
  onFileClear,
  selectedFile = null,
  acceptedMediaTypes = ["video", "image", "audio"],
  acceptedFormats,
  maxFileSize,
  disabled = false,
  isUploading = false,
  className = "",
  showPreview = true,
  compact = false,
  placeholder,
  error: externalError,
}: FileUploadZoneProps) {
  const [fileError, setFileError] = useState<FileError | null>(null);

  // Build accept configuration
  const acceptConfig = useMemo(() => {
    if (acceptedFormats && acceptedFormats.length > 0) {
      const accept: Record<string, string[]> = {};
      for (const format of acceptedFormats) {
        const normalizedFormat = format.startsWith(".") ? format : `.${format}`;
        
        const ext = normalizedFormat.slice(1).toLowerCase();

        // Map common extensions to MIME types
        const mimeMap: Record<string, string> = {
          mp4: "video/mp4",
          webm: "video/webm",
          avi: "video/x-msvideo",
          mov: "video/quicktime",
          mkv: "video/x-matroska",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          bmp: "image/bmp",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          ogg: "audio/ogg",
          aac: "audio/aac",
          flac: "audio/flac",
        };

        const mimeType = mimeMap[ext];
        if (mimeType) {
          if (!accept[mimeType]) {
            accept[mimeType] = [];
          }
          accept[mimeType].push(normalizedFormat);
        }
      }
      return accept;
    }

    // Use media types
    return buildDropzoneAccept(acceptedMediaTypes);
  }, [acceptedFormats, acceptedMediaTypes]);

    
  // Calculate max file size based on media type or custom value
  const effectiveMaxSize = useMemo(() => {
    if (maxFileSize) return maxFileSize;

    if (acceptedMediaTypes.length === 1) {
      return MAX_FILE_SIZES[acceptedMediaTypes[0]];
    }

    return Math.max(...acceptedMediaTypes.map((type) => MAX_FILE_SIZES[type]));
  }, [maxFileSize, acceptedMediaTypes]);

    
  // Get description of accepted types
  const acceptedTypesDescription = useMemo(() => {
    if (acceptedFormats && acceptedFormats.length > 0) {
      return acceptedFormats
        .map((f) => (f.startsWith(".") ? f : `.${f}`))
        .join(", ");
    }
    return getAcceptedTypesDescription(acceptedMediaTypes);
  }, [acceptedFormats, acceptedMediaTypes]);

    
  // Handle file drop/selection
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setFileError(null);

      // Handle rejections
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const error = rejection.errors[0];

        if (error.code === "file-invalid-type") {
          setFileError({
            message: `Invalid file type. Accepted types: ${acceptedTypesDescription}`,
            code: "INVALID_TYPE",
          });
        } else if (error.code === "file-too-large") {
          setFileError({
            message: `File is too large. Maximum size: ${formatFileSize(
              effectiveMaxSize
            )}`,
            code: "FILE_TOO_LARGE",
          });
        } else {
          setFileError({
            message: error.message,
            code: error.code,
          });
        }
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        const detectedType = detectMediaType(file);
        if (!detectedType) {
          setFileError({
            message:
              "Could not determine file type. Please select a valid media file.",
            code: "UNKNOWN_TYPE",
          });
          return;
        }

        // Check if detected type is in accepted types
        if (acceptedMediaTypes.length > 0 && !acceptedFormats) {
          if (!acceptedMediaTypes.includes(detectedType)) {
            const expectedTypes = acceptedMediaTypes.join(", ");
            setFileError({
              message: `Expected ${expectedTypes} file, but got ${detectedType} file.`,
              code: "MEDIA_TYPE_MISMATCH",
            });
            return;
          }
        }

        onFileSelect(file);
      }
    },
    [
      onFileSelect,
      acceptedTypesDescription,
      effectiveMaxSize,
      acceptedMediaTypes,
      acceptedFormats,
    ]
  );

  // Handle file removal
  const handleRemove = useCallback(() => {
    setFileError(null);
    onFileClear?.();
  }, [onFileClear]);


  // Dropzone configuration
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: acceptConfig,
    maxSize: effectiveMaxSize,
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading,
    noClick: false,
    noKeyboard: false,
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone(dropzoneOptions);

  
  const displayError = externalError || fileError?.message;

  if (selectedFile && showPreview) {
    return (
      <div className={className}>
        <FilePreview
          file={selectedFile}
          onRemove={disabled || isUploading ? undefined : handleRemove}
          onReplace={disabled || isUploading ? undefined : open}
          compact={compact}
          showActions={true}
          isUploading={isUploading}
        />

        {displayError && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Hidden input for replace functionality */}
        <input {...getInputProps()} />
      </div>
    );
  }

  // Determine zone styling based on state
  const getZoneClasses = () => {
    const baseClasses = `
      relative border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out
      focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
    `;

    if (disabled || isUploading) {
      return `${baseClasses} border-gray-200 bg-gray-50 cursor-not-allowed opacity-60`;
    }

    if (isDragReject) {
      return `${baseClasses} border-red-400 bg-red-50`;
    }

    if (isDragAccept) {
      return `${baseClasses} border-green-400 bg-green-50`;
    }

    if (isDragActive) {
      return `${baseClasses} border-blue-400 bg-blue-50`;
    }

    return `${baseClasses} border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 cursor-pointer`;
  };

  // Padding based on compact mode
  const paddingClasses = compact ? "p-4" : "p-8";

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`${getZoneClasses()} ${paddingClasses}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`
            rounded-full p-3 mb-4
            ${isDragReject ? "bg-red-100" : ""}
            ${isDragAccept ? "bg-green-100" : ""}
            ${
              isDragActive && !isDragAccept && !isDragReject
                ? "bg-blue-100"
                : ""
            }
            ${!isDragActive ? "bg-gray-100" : ""}
          `}
          >
            {isDragReject ? (
              <X className="h-8 w-8 text-red-500" />
            ) : isDragAccept ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <Upload
                className={`h-8 w-8 ${
                  isDragActive ? "text-blue-500" : "text-gray-400"
                }`}
              />
            )}
          </div>

          {/* Main text */}
          <div className="space-y-1">
            {isDragReject ? (
              <p className="text-sm font-medium text-red-600">
                This file type is not accepted
              </p>
            ) : isDragAccept ? (
              <p className="text-sm font-medium text-green-600">
                Drop to upload this file
              </p>
            ) : isDragActive ? (
              <p className="text-sm font-medium text-blue-600">
                Drop your file here
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  {placeholder || "Drag and drop your file here"}
                </p>
                <p className="text-sm text-gray-500">
                  or{" "}
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    click to browse
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Accepted types hint */}
          {!isDragActive && !compact && (
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>Accepted: {acceptedTypesDescription}</p>
              <p>Maximum size: {formatFileSize(effectiveMaxSize)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{displayError}</p>
            {fileError?.code === "INVALID_TYPE" && (
              <p className="text-xs text-red-600 mt-1">
                Please select a file with one of these extensions:{" "}
                {acceptedMediaTypes
                  .flatMap((type) => getAcceptedExtensions(type))
                  .map((ext) => `.${ext}`)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * Simple drop zone for minimal use cases
 */
export function SimpleDropZone({
  onFileSelect,
  accept,
  maxSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
  className = "",
  children,
}: {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      {children || (
        <p className="text-sm text-gray-600">
          {isDragActive ? "Drop file here" : "Drag & drop or click to select"}
        </p>
      )}
    </div>
  );
}
