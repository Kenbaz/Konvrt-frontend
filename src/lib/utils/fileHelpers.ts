/**
 * File Helper Utilities
 * 
 * Provides utility functions for working with files:
 * - File size formatting
 * - MIME type detection
 * - File extension helpers
 * - Media type detection
 */

import type { MediaType } from "@/types";

// Format file size in bytes to human-readable string
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);

    const smallerSizesPrecision = i < 2 ? 0 : i < 3 ? 1 : 2;

    return `${size.toFixed(smallerSizesPrecision)} ${units[i]}`;
};


// Get file extension from filename
export function getFileExtension(filename: string): string { 
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) { 
        return '';
    };
    return filename.slice(lastDotIndex + 1).toLowerCase();
};


export function getFileNameWithoutExtension(filename: string): string { 
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) { 
        return filename;
    };
    return filename.slice(0, lastDotIndex);
};


// Mime type to media type mapping
const MIME_TO_MEDIA_TYPE: Record<string, MediaType> = {
  // Video
  "video/mp4": "video",
  "video/webm": "video",
  "video/x-msvideo": "video",
  "video/avi": "video",
  "video/quicktime": "video",
  "video/x-matroska": "video",
  "video/x-flv": "video",
  "video/mpeg": "video",
  "video/3gpp": "video",
  "video/ogg": "video",

  // Image
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/bmp": "image",
  "image/tiff": "image",
  "image/svg+xml": "image",
  "image/x-icon": "image",
  "image/heic": "image",
  "image/heif": "image",

  // Audio
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/ogg": "audio",
  "audio/aac": "audio",
  "audio/flac": "audio",
  "audio/x-flac": "audio",
  "audio/webm": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
};


/**
 * Extension to media type mapping (fallback when MIME type is not reliable)
 */
const EXTENSION_TO_MEDIA_TYPE: Record<string, MediaType> = {
  // Video
  mp4: 'video',
  webm: 'video',
  avi: 'video',
  mov: 'video',
  mkv: 'video',
  flv: 'video',
  mpeg: 'video',
  mpg: 'video',
  '3gp': 'video',
  wmv: 'video',
  
  // Image
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  tiff: 'image',
  tif: 'image',
  svg: 'image',
  ico: 'image',
  heic: 'image',
  heif: 'image',
  
  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  aac: 'audio',
  flac: 'audio',
  m4a: 'audio',
  wma: 'audio',
};


export function detectMediaType(file: File): MediaType | null {
    if (file.type && MIME_TO_MEDIA_TYPE[file.type]) { 
        return MIME_TO_MEDIA_TYPE[file.type];
    };

    // Fallback to extension-based detection
    const extension = getFileExtension(file.name);
    if (extension && EXTENSION_TO_MEDIA_TYPE[extension]) { 
        return EXTENSION_TO_MEDIA_TYPE[extension];
    };

    // Check Mime type prefix
    if (file.type) {
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'audio';
    };

    return null;
};


export function isValidMediaFile(file: File): boolean {
    return detectMediaType(file) !== null;
};


export function getMediaTypeDisplayName(mediaType: MediaType): string { 
    const names: Record<MediaType, string> = {
        video: "Video",
        image: "Image",
        audio: "Audio",
    };
    return names[mediaType] ?? "Unknown";
};


export function getMediaTypeIconName(mediaType: MediaType | null): string {
  if (!mediaType) return "File";

  const icons: Record<MediaType, string> = {
    video: "Video",
    image: "Image",
    audio: "Music",
  };
  return icons[mediaType] ?? "File";
};


export const ACCEPTED_MIME_TYPES: Record<MediaType, string[]> = {
  video: [
    "video/mp4",
    "video/webm",
    "video/x-msvideo",
    "video/avi",
    "video/quicktime",
    "video/x-matroska",
    "video/mpeg",
  ],
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ],
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
  ],
};

export function getAcceptedExtensions(mediaType: MediaType): string[] { 
    const extensions: Record<MediaType, string[]> = {
      video: ["mp4", "webm", "avi", "mov", "mkv", "mpeg", "mpg"],
      image: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"],
      audio: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
    };
    return extensions[mediaType] ?? [];
};


export function buildAcceptString(mediaTypes: MediaType[]): string { 
    const mimeTypes: string[] = [];

    for (const mediaType of mediaTypes) {
        const types = ACCEPTED_MIME_TYPES[mediaType];
        if (types) {
            mimeTypes.push(...types);
        }
    };

    return mimeTypes.join(", ");
};


export function buildDropZoneAcceptObject(mediaTypes: MediaType[]): Record<string, string[]> { 
    const acceptObject: Record<string, string[]> = {};

    for (const mediaType of mediaTypes) { 
        const mimeTypes = ACCEPTED_MIME_TYPES[mediaType];
        const extensions = getAcceptedExtensions(mediaType);

        if (mimeTypes) {
            for (const mimeType of mimeTypes) {
                acceptObject[mimeType] = extensions.map(ext => `.${ext}`);
            }
        };
    };

    return acceptObject;
};


export function getAcceptedTypesDescription(mediaTypes: MediaType[]): string { 
    const descriptions: string[] = [];

    for (const mediaType of mediaTypes) { 
        const extensions = getAcceptedExtensions(mediaType);
        if (extensions.length > 0) {
          descriptions.push(
            `${getMediaTypeDisplayName(mediaType)} (${extensions
              .map((e) => `.${e}`)
              .join(", ")})`
          );
        };
    };

    return descriptions.join("; ");
};


export function fileMatchesMediaTypes(file: File, mediaTypes: MediaType[]): boolean { 
    const fileMediaType = detectMediaType(file);
    if (!fileMediaType) return false;

    return mediaTypes.includes(fileMediaType);
};


export function createFilePreviewUrl(file: File): string | null { 
    const mediaType = detectMediaType(file);
    if (mediaType === 'image' || mediaType === 'video') {
        return URL.createObjectURL(file);
    };
    return null;
};


export function revokeFilePreviewUrl(url: string): void { 
    URL.revokeObjectURL(url);
};


export function truncateFilename(filename: string, maxLength: number = 30): string {
    if (filename.length <= maxLength) return filename;

    const extension = getFileExtension(filename);
    const nameWithoutExt = getFileNameWithoutExtension(filename);

    const extensionPart = extension ? `.${extension}` : '';
    const availableLength = maxLength - extensionPart.length - 3; // 3 for "..."

    if (availableLength <= 0) { 
        return filename.slice(0, maxLength - 3) + '...';
    };

    return nameWithoutExt.slice(0, availableLength) + '...' + extensionPart;
};