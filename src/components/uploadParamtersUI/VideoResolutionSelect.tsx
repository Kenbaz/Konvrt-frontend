/**
 * Video Resolution Select Component
 *
 * A specialized select component for choosing video resolutions.
 * Provides common resolution presets with aspect ratio information.
 *
 * Note: This component is designed for future use when resolution
 * parameters are added to video operations. Currently, video operations
 * use width/height integer parameters.
 */

"use client";

import { useId, useCallback, useMemo, type ChangeEvent } from "react";
import { clsx } from "clsx";
import { Monitor, AlertCircle, HelpCircle } from "lucide-react";

// Common video resolution presets
export interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
}

export const VIDEO_RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: "4K UHD", width: 3840, height: 2160, aspectRatio: "16:9", description: "Ultra HD, best quality" },
  { label: "2K QHD", width: 2560, height: 1440, aspectRatio: "16:9", description: "Quad HD, high quality" },
  { label: "1080p Full HD", width: 1920, height: 1080, aspectRatio: "16:9", description: "Standard HD, recommended" },
  { label: "720p HD", width: 1280, height: 720, aspectRatio: "16:9", description: "HD, good for web" },
  { label: "480p SD", width: 854, height: 480, aspectRatio: "16:9", description: "Standard definition" },
  { label: "360p", width: 640, height: 360, aspectRatio: "16:9", description: "Low quality, small file" },
];

// Portrait resolutions (9:16)
export const PORTRAIT_RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: "1080x1920 (9:16)", width: 1080, height: 1920, aspectRatio: "9:16", description: "Full HD Portrait" },
  { label: "720x1280 (9:16)", width: 720, height: 1280, aspectRatio: "9:16", description: "HD Portrait" },
];

// Square resolutions (1:1)
export const SQUARE_RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: "1080x1080 (1:1)", width: 1080, height: 1080, aspectRatio: "1:1", description: "Square HD" },
  { label: "720x720 (1:1)", width: 720, height: 720, aspectRatio: "1:1", description: "Square" },
];

// All presets combined
export const ALL_RESOLUTION_PRESETS: ResolutionPreset[] = [
  ...VIDEO_RESOLUTION_PRESETS,
  ...PORTRAIT_RESOLUTION_PRESETS,
  ...SQUARE_RESOLUTION_PRESETS,
];

export interface VideoResolutionSelectProps {
  value: { width?: number; height?: number } | null;
  onChange: (value: { width: number; height: number } | null) => void;
  presets?: ResolutionPreset[];
  allowCustom?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  showAspectRatio?: boolean;
  className?: string;
}

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

/**
 * Create a value string from resolution dimensions
 */
function resolutionToValue(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * Parse a resolution value string to dimensions
 */
function valueToResolution(value: string): { width: number; height: number } | null {
  if (!value) return null;
  
  const parts = value.split("x");
  if (parts.length !== 2) return null;
  
  const width = parseInt(parts[0], 10);
  const height = parseInt(parts[1], 10);
  
  if (isNaN(width) || isNaN(height)) return null;
  
  return { width, height };
}

/**
 * Video Resolution Select Component
 */
export function VideoResolutionSelect({
  value,
  onChange,
  presets = VIDEO_RESOLUTION_PRESETS,
  allowCustom = false,
  label = "Resolution",
  helperText,
  error,
  disabled = false,
  showAspectRatio = true,
  className,
}: VideoResolutionSelectProps) {
  const generatedId = useId();
  const selectId = `resolution-${generatedId}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = Boolean(error);

  // Convert current value to select value
  const selectValue = useMemo(() => {
    if (!value || !value.width || !value.height) return "";
    return resolutionToValue(value.width, value.height);
  }, [value]);

  // Handle selection change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      
      if (!newValue) {
        onChange(null);
        return;
      }
      
      const resolution = valueToResolution(newValue);
      onChange(resolution);
    },
    [onChange]
  );

  // Group presets by aspect ratio for better organization
  const groupedPresets = useMemo(() => {
    const groups: Record<string, ResolutionPreset[]> = {};
    
    for (const preset of presets) {
      if (!groups[preset.aspectRatio]) {
        groups[preset.aspectRatio] = [];
      }
      groups[preset.aspectRatio].push(preset);
    }
    
    return groups;
  }, [presets]);

  const ariaDescribedBy = hasError
    ? errorId
    : helperText
    ? helperId
    : undefined;

  return (
    <div className={clsx("space-y-1.5", className)}>
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
        {/* Monitor icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Monitor
            className={clsx("h-5 w-5", hasError ? "text-red-500" : "text-gray-400")}
            aria-hidden="true"
          />
        </div>

        {/* Select */}
        <select
          id={selectId}
          value={selectValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          className={clsx(
            baseSelectStyles,
            hasError ? selectStateStyles.error : selectStateStyles.default
          )}
        >
          <option value="">Select resolution...</option>

          {/* Render grouped presets */}
          {Object.entries(groupedPresets).map(([aspectRatio, groupPresets]) => (
            <optgroup key={aspectRatio} label={`${aspectRatio} Aspect Ratio`}>
              {groupPresets.map((preset) => (
                <option
                  key={resolutionToValue(preset.width, preset.height)}
                  value={resolutionToValue(preset.width, preset.height)}
                >
                  {preset.label} ({preset.width}×{preset.height})
                  {showAspectRatio ? "" : ` - ${preset.description}`}
                </option>
              ))}
            </optgroup>
          ))}

          {/* Custom option */}
          {allowCustom && (
            <optgroup label="Custom">
              <option value="custom">Custom resolution...</option>
            </optgroup>
          )}
        </select>

        {/* Icons */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          )}
          <svg
            className={clsx("h-5 w-5", hasError ? "text-red-500" : "text-gray-400")}
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

      {/* Selected resolution info */}
      {value && value.width && value.height && (
        <p className="text-xs text-gray-500">
          {value.width} × {value.height} pixels
          {(() => {
            const preset = presets.find(
              (p) => p.width === value.width && p.height === value.height
            );
            return preset ? ` • ${preset.description}` : "";
          })()}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Helper function to get resolution preset by dimensions
 */
export function getResolutionPreset(
  width: number,
  height: number,
  presets: ResolutionPreset[] = ALL_RESOLUTION_PRESETS
): ResolutionPreset | undefined {
  return presets.find((p) => p.width === width && p.height === height);
}

/**
 * Helper function to get closest resolution preset
 */
export function getClosestResolutionPreset(
  width: number,
  height: number,
  presets: ResolutionPreset[] = VIDEO_RESOLUTION_PRESETS
): ResolutionPreset {
  const targetPixels = width * height;
  
  let closest = presets[0];
  let closestDiff = Math.abs(closest.width * closest.height - targetPixels);
  
  for (const preset of presets) {
    const diff = Math.abs(preset.width * preset.height - targetPixels);
    if (diff < closestDiff) {
      closest = preset;
      closestDiff = diff;
    }
  }
  
  return closest;
};