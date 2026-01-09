"use client";

import { useCallback, useState, useMemo } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { Upload, AlertCircle } from "lucide-react";
import { FilePreview } from "./Filepreview";
import {
  formatFileSize,
  getAcceptedTypesDescription,
  getAcceptedExtensions,
} from "@/lib/utils/fileHelpers";
import {
  FILE_SIZE_LIMITS,
  DEFAULT_MAX_FILE_SIZE,
  validateFile,
} from "@/lib/utils/fileValidations";
import type { MediaType } from "@/types/common-types";


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

    
  // Calculate max file size based on media type or custom value
  const effectiveMaxSize = useMemo(() => {
    if (maxFileSize) return maxFileSize;

    if (acceptedMediaTypes.length === 1) {
      return FILE_SIZE_LIMITS[acceptedMediaTypes[0]] ?? DEFAULT_MAX_FILE_SIZE;
    }

    return Math.max(...acceptedMediaTypes.map((type) => FILE_SIZE_LIMITS[type] ?? DEFAULT_MAX_FILE_SIZE));
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

    
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFileError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Use our comprehensive validation for type and size
      const validationResult = validateFile(
        file,
        acceptedFormats ? undefined : acceptedMediaTypes,
        maxFileSize
      );

      if (!validationResult.isValid && validationResult.error) {
        setFileError({
          message: validationResult.error.message,
          code: validationResult.error.code,
        });
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, acceptedMediaTypes, acceptedFormats, maxFileSize]
  );

  // Handle file removal
  const handleRemove = useCallback(() => {
    setFileError(null);
    onFileClear?.();
  }, [onFileClear]);


  const dropzoneOptions: DropzoneOptions = {
    onDrop,
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
      focus-within:outline-none 
    `;

    if (disabled || isUploading) {
      return `${baseClasses} border-gray-200 bg-gray-50 cursor-not-allowed opacity-60`;
    }

    if (isDragActive) {
      return `${baseClasses} `;
    }

    return `${baseClasses} border-gray-300 bg-[#1a1a1e] hover:border-gray-500 cursor-pointer`;
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
            ${isDragActive ? "bg-blue-100" : "bg-gray-100"}
          `}
          >
            <Upload
              className={`h-8 w-8 ${
                isDragActive ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </div>

          {/* Main text */}
          <div className="space-y-1">
            {isDragActive ? (
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
            <p className="text-sm font-medium text-red-700">{displayError}</p>
            {fileError?.code === "INVALID_TYPE" && (
              <p className="text-xs text-red-600 mt-1">
                Please select a file with one of these extensions:{" "}
                {acceptedMediaTypes
                  .flatMap((type) => getAcceptedExtensions(type))
                  .map((ext) => `.${ext}`)
                  .join(", ")}
              </p>
            )}
            {fileError?.code === "FILE_TOO_LARGE" && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                <p className="font-medium">File size limits:</p>
                <ul className="mt-1 list-disc list-inside">
                  {acceptedMediaTypes.map((type) => (
                    <li key={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}: {formatFileSize(FILE_SIZE_LIMITS[type] ?? DEFAULT_MAX_FILE_SIZE)}
                    </li>
                  ))}
                </ul>
              </div>
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
};