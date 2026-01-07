// src/componets/uploadsUI/Filepreview.tsx

'use client';

import { useState, useEffect } from "react";
import {
  X,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
    formatFileSize,
    getFileExtension,
    detectMediaType,
    truncateFilename,
    getMediaTypeDisplayName
} from "@/lib/utils";
import type { MediaType } from "@/types";

export interface FilePreviewProps {
    file: File;
    onRemove?: () => void;
    onReplace?: () => void;
    compact?: boolean;
    showActions?: boolean;
    isUploading?: boolean;
    className?: string;
};


function useFilePreviewUrl(file: File, enabled: boolean = true): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
      return;
    }

    let url: string | null = null;

    try {
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Failed to create preview URL:", err);
      setPreviewUrl(null);
    }

    // Cleanup: revoke the URL when file changes or component unmounts
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file, enabled]);

  return previewUrl;
}


function MediaTypeIcon({
  mediaType,
  className,
}: {
  mediaType: MediaType | null;
  className?: string;
}) {
  const iconClass = className ?? "h-8 w-8";

  switch (mediaType) {
    case "video":
      return <Video className={iconClass} />;
    case "image":
      return <ImageIcon className={iconClass} />;
    case "audio":
      return <Music className={iconClass} />;
    default:
      return <File className={iconClass} />;
  }
};


export function FilePreview({
    file,
    onRemove,
    onReplace,
    compact = false,
    showActions = true,
    isUploading = false,
    className = "",
}: FilePreviewProps) {
  const mediaType = detectMediaType(file);
  const extension = getFileExtension(file.name);

  // Only create preview URL for images
  const isImage = mediaType === 'image';
  const previewUrl = useFilePreviewUrl(file, isImage);

  // Compact layout
  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-[#1a1a1e] rounded-lg border border-gray-900 ${className}`}
      >
        {/* Icon or thumbnail */}
        <div className="shrink-0 h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <MediaTypeIcon
              mediaType={mediaType}
              className="h-5 w-5 text-gray-500"
            />
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-gray-900 truncate"
            title={file.name}
          >
            {truncateFilename(file.name, 25)}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
            {extension && ` • ${extension.toUpperCase()}`}
          </p>
        </div>

        {/* Actions */}
        {showActions && !isUploading && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 p-1 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };
  
    
  // Full layout
  return (
    <div className={`bg-[#1a1a1e] rounded-lg border border-gray-900 shadow-sm overflow-hidden ${className}`}>
      {/* Preview area */}
      <div className="relative bg-[#1a1a1e] aspect-video flex items-center justify-center">
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <MediaTypeIcon mediaType={mediaType} className="h-16 w-16" />
            {mediaType && (
              <span className="text-sm font-medium">{getMediaTypeDisplayName(mediaType)} File</span>
            )}
          </div>
        )}
        
        {/* Media type badge */}
        {mediaType && (
          <div className="absolute top-3 left-3">
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${mediaType === 'video' ? 'bg-purple-100 text-purple-700' : ''}
              ${mediaType === 'image' ? 'bg-blue-100 text-blue-700' : ''}
              ${mediaType === 'audio' ? 'bg-green-100 text-green-700' : ''}
            `}>
              <MediaTypeIcon mediaType={mediaType} className="h-3 w-3" />
              {getMediaTypeDisplayName(mediaType)}
            </span>
          </div>
        )}
        
        {/* File extension badge */}
        {extension && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-white">
              .{extension}
            </span>
          </div>
        )}
      </div>
      
      {/* File info section */}
      <div className="p-4">
        {/* File name */}
        <h4 className="text-sm font-semibold text-gray-900 truncate" title={file.name}>
          {file.name}
        </h4>
        
        {/* File details */}
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {formatFileSize(file.size)}
          </span>
          {file.type && (
            <span className="truncate" title={file.type}>
              {file.type}
            </span>
          )}
        </div>
        
        {/* Actions */}
        {showActions && !isUploading && (
          <div className="mt-4 flex items-center gap-2">
            {onReplace && (
              <button
                type="button"
                onClick={onReplace}
                className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Replace
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


/**
 * Compact file info display (for inline use)
 */
export function FileInfo({ file, className = "" }: { file: File; className?: string }) {
  const mediaType = detectMediaType(file);
  const extension = getFileExtension(file.name);
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <MediaTypeIcon mediaType={mediaType} className="h-4 w-4 text-gray-500" />
      <span className="font-medium text-gray-700 truncate" title={file.name}>
        {truncateFilename(file.name, 20)}
      </span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-500">{formatFileSize(file.size)}</span>
      {extension && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 uppercase">{extension}</span>
        </>
      )}
    </div>
  );
};