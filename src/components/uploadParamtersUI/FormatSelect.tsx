/**
 * Format Select Component
 *
 * A specialized select component for choosing output formats.
 * Provides format descriptions, compatibility info, and visual indicators.
 *
 * Supports video, audio, and image formats with appropriate metadata.
 */

"use client";

import { useId, useCallback, useMemo, type ChangeEvent } from "react";
import { clsx } from "clsx";
import { FileType, AlertCircle, HelpCircle, Check } from "lucide-react";
import type { MediaType } from "@/types";

export interface FormatInfo {
  format: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  lossy: boolean;
  supportsTransparency?: boolean;
  supportsAnimation?: boolean;
  browserSupport: "universal" | "good" | "limited";
};

// Video format information
export const VIDEO_FORMATS: FormatInfo[] = [
  {
    format: "mp4",
    label: "MP4 (H.264)",
    description: "Most compatible video format",
    pros: ["Universal playback", "Good compression", "Streaming support"],
    cons: ["Lossy compression"],
    bestFor: "General use, web, mobile",
    lossy: true,
    browserSupport: "universal",
  },
  {
    format: "webm",
    label: "WebM (VP9)",
    description: "Modern web video format",
    pros: ["Better compression than H.264", "Open format", "Web optimized"],
    cons: ["Limited device support", "Slower encoding"],
    bestFor: "Web delivery, modern browsers",
    lossy: true,
    browserSupport: "good",
  },
  {
    format: "mov",
    label: "MOV (QuickTime)",
    description: "Apple QuickTime format",
    pros: ["High quality", "Professional editing", "Apple ecosystem"],
    cons: ["Large files", "Limited web support"],
    bestFor: "Apple devices, video editing",
    lossy: true,
    browserSupport: "limited",
  },
];

// Audio format information
export const AUDIO_FORMATS: FormatInfo[] = [
  {
    format: "mp3",
    label: "MP3",
    description: "Universal audio format",
    pros: ["Universal support", "Small files", "Good quality at 192+ kbps"],
    cons: ["Lossy compression", "No metadata for chapters"],
    bestFor: "Music, podcasts, general audio",
    lossy: true,
    browserSupport: "universal",
  },
  {
    format: "wav",
    label: "WAV",
    description: "Uncompressed audio",
    pros: ["Lossless quality", "No compression artifacts", "Professional standard"],
    cons: ["Very large files", "No compression"],
    bestFor: "Audio editing, archival, professional use",
    lossy: false,
    browserSupport: "universal",
  },
  {
    format: "aac",
    label: "AAC",
    description: "Advanced Audio Coding",
    pros: ["Better than MP3 at same bitrate", "Apple standard", "Streaming support"],
    cons: ["Less universal than MP3"],
    bestFor: "Apple devices, streaming, podcasts",
    lossy: true,
    browserSupport: "good",
  },
  {
    format: "m4a",
    label: "M4A",
    description: "MPEG-4 Audio",
    pros: ["Good quality", "Metadata support", "Apple compatible"],
    cons: ["Limited non-Apple support"],
    bestFor: "iTunes, Apple Music, podcasts",
    lossy: true,
    browserSupport: "good",
  },
  {
    format: "ogg",
    label: "OGG Vorbis",
    description: "Open source audio format",
    pros: ["Open format", "Good compression", "No patents"],
    cons: ["Limited device support"],
    bestFor: "Gaming, open source projects",
    lossy: true,
    browserSupport: "good",
  },
  {
    format: "flac",
    label: "FLAC",
    description: "Free Lossless Audio Codec",
    pros: ["Lossless compression", "50-70% size reduction", "Open format"],
    cons: ["Larger than lossy formats", "Limited streaming support"],
    bestFor: "Audiophiles, archival, high-fidelity",
    lossy: false,
    browserSupport: "good",
  },
  {
    format: "opus",
    label: "Opus",
    description: "Modern codec for voice and music",
    pros: ["Excellent quality", "Low latency", "Best compression ratio"],
    cons: ["Limited legacy support"],
    bestFor: "VoIP, streaming, modern applications",
    lossy: true,
    browserSupport: "good",
  },
];

// Image format information
export const IMAGE_FORMATS: FormatInfo[] = [
  {
    format: "jpg",
    label: "JPEG",
    description: "Standard photo format",
    pros: ["Universal support", "Small files", "Good for photos"],
    cons: ["Lossy", "No transparency", "Artifacts at low quality"],
    bestFor: "Photos, web images",
    lossy: true,
    supportsTransparency: false,
    supportsAnimation: false,
    browserSupport: "universal",
  },
  {
    format: "png",
    label: "PNG",
    description: "Lossless with transparency",
    pros: ["Lossless", "Transparency support", "Good for graphics"],
    cons: ["Larger than JPEG for photos"],
    bestFor: "Graphics, logos, screenshots",
    lossy: false,
    supportsTransparency: true,
    supportsAnimation: false,
    browserSupport: "universal",
  },
  {
    format: "webp",
    label: "WebP",
    description: "Modern web image format",
    pros: ["Better compression", "Transparency", "Animation support"],
    cons: ["Limited legacy browser support"],
    bestFor: "Web delivery, modern sites",
    lossy: true, // Can be both, but typically lossy
    supportsTransparency: true,
    supportsAnimation: true,
    browserSupport: "good",
  },
  {
    format: "gif",
    label: "GIF",
    description: "Animated image format",
    pros: ["Animation support", "Universal support", "Simple"],
    cons: ["Limited colors (256)", "Large animated files"],
    bestFor: "Simple animations, memes",
    lossy: true,
    supportsTransparency: true,
    supportsAnimation: true,
    browserSupport: "universal",
  },
  {
    format: "bmp",
    label: "BMP",
    description: "Bitmap image format",
    pros: ["Lossless", "Simple format", "Wide support"],
    cons: ["Very large files", "No compression"],
    bestFor: "Windows applications, raw images",
    lossy: false,
    supportsTransparency: false,
    supportsAnimation: false,
    browserSupport: "universal",
  },
];

export function getFormatsForMediaType(mediaType: MediaType): FormatInfo[] {
  switch (mediaType) {
    case "video":
      return VIDEO_FORMATS;
    case "audio":
      return AUDIO_FORMATS;
    case "image":
      return IMAGE_FORMATS;
    default:
      return [];
  }
};

export interface FormatSelectProps {
  value: string;
  onChange: (value: string) => void;
  formats?: FormatInfo[];
  mediaType?: MediaType;
  allowedFormats?: string[];
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  showDetails?: boolean;
  showBadges?: boolean;
  placeholder?: string;
  className?: string;
};


// Base styles
const baseSelectStyles = clsx(
  "block w-full rounded-lg border",
  "bg-white text-gray-900",
  "appearance-none cursor-pointer",
  "transition-colors duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
  "px-3 py-2 pl-10 pr-10 text-sm"
);

const selectStateStyles = {
  default: clsx(
    "border-gray-300",
    "hover:border-gray-400",
    "focus:border-blue-500 focus:ring-blue-500"
  ),
  error: clsx(
    "border-red-500",
    "hover:border-red-600",
    "focus:border-red-500 focus:ring-red-500"
  ),
};


export function FormatSelect({
  value,
  onChange,
  formats: propFormats,
  mediaType,
  allowedFormats,
  label = "Output Format",
  helperText,
  error,
  disabled = false,
  showDetails = true,
  showBadges = true,
  placeholder = "Select format...",
  className,
}: FormatSelectProps) {
  const generatedId = useId();
  const selectId = `format-${generatedId}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = Boolean(error);

  // Get available formats
  const formats = useMemo(() => {
    let availableFormats = propFormats;

    if (!availableFormats && mediaType) {
      availableFormats = getFormatsForMediaType(mediaType);
    }

    if (!availableFormats) {
      availableFormats = [...VIDEO_FORMATS, ...AUDIO_FORMATS, ...IMAGE_FORMATS];
    }

    // Filter by allowed formats if specified
    if (allowedFormats && allowedFormats.length > 0) {
      availableFormats = availableFormats.filter((f) =>
        allowedFormats.includes(f.format)
      );
    }

    return availableFormats;
  }, [propFormats, mediaType, allowedFormats]);

  // Get selected format info
  const selectedFormat = useMemo(() => {
    return formats.find((f) => f.format === value);
  }, [formats, value]);

  // Handle selection change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const ariaDescribedBy = hasError
    ? errorId
    : helperText
    ? helperId
    : undefined;

  return (
    <div className={clsx("space-y-2", className)}>
      {/* Label */}
      <div className="flex items-center gap-2">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        {helperText && (
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg left-0">
              {helperText}
              <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        )}
      </div>

      {/* Select wrapper */}
      <div className="relative">
        {/* File type icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FileType
            className={clsx(
              "h-5 w-5",
              hasError ? "text-red-500" : "text-gray-400"
            )}
            aria-hidden="true"
          />
        </div>

        {/* Select */}
        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          className={clsx(
            baseSelectStyles,
            hasError ? selectStateStyles.error : selectStateStyles.default
          )}
        >
          <option value="">{placeholder}</option>
          {formats.map((format) => (
            <option key={format.format} value={format.format}>
              {format.label} - {format.description}
            </option>
          ))}
        </select>

        {/* Icons */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          )}
          <svg
            className={clsx(
              "h-5 w-5",
              hasError ? "text-red-500" : "text-gray-400"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Format badges */}
      {showBadges && selectedFormat && (
        <div className="flex flex-wrap gap-1.5">
          {/* Lossy/Lossless badge */}
          <span
            className={clsx(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              selectedFormat.lossy
                ? "bg-amber-100 text-amber-800"
                : "bg-green-100 text-green-800"
            )}
          >
            {selectedFormat.lossy ? "Lossy" : "Lossless"}
          </span>

          {/* Browser support badge */}
          <span
            className={clsx(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              selectedFormat.browserSupport === "universal"
                ? "bg-green-100 text-green-800"
                : selectedFormat.browserSupport === "good"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            )}
          >
            {selectedFormat.browserSupport === "universal"
              ? "Universal Support"
              : selectedFormat.browserSupport === "good"
              ? "Good Support"
              : "Limited Support"}
          </span>

          {/* Transparency badge for images */}
          {selectedFormat.supportsTransparency !== undefined && (
            <span
              className={clsx(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                selectedFormat.supportsTransparency
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {selectedFormat.supportsTransparency
                ? "Transparency"
                : "No Transparency"}
            </span>
          )}

          {/* Animation badge for images */}
          {selectedFormat.supportsAnimation && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
              Animation
            </span>
          )}
        </div>
      )}

      {/* Format details */}
      {showDetails && selectedFormat && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Best for:</span>{" "}
            {selectedFormat.bestFor}
          </p>

          {/* Pros */}
          {selectedFormat.pros.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">
                Advantages:
              </p>
              <ul className="space-y-0.5">
                {selectedFormat.pros.map((pro, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {selectedFormat.cons.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">
                Limitations:
              </p>
              <ul className="space-y-0.5">
                {selectedFormat.cons.map((con, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <span className="h-3 w-3 flex items-center justify-center text-amber-500 shrink-0">
                      •
                    </span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};


export function VideoFormatSelect(
  props: Omit<FormatSelectProps, "mediaType" | "formats">
) {
  return (
    <FormatSelect
      {...props}
      mediaType="video"
      label={props.label ?? "Video Format"}
    />
  );
};


export function AudioFormatSelect(
  props: Omit<FormatSelectProps, "mediaType" | "formats">
) {
  return (
    <FormatSelect
      {...props}
      mediaType="audio"
      label={props.label ?? "Audio Format"}
    />
  );
};


export function ImageFormatSelect(
  props: Omit<FormatSelectProps, "mediaType" | "formats">
) {
  return (
    <FormatSelect
      {...props}
      mediaType="image"
      label={props.label ?? "Image Format"}
    />
  );
};


export function getFormatInfo(format: string): FormatInfo | undefined {
  const allFormats = [...VIDEO_FORMATS, ...AUDIO_FORMATS, ...IMAGE_FORMATS];
  return allFormats.find(
    (f) => f.format === format || f.format === format.toLowerCase()
  );
};