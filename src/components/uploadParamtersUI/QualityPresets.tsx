// src/components/uploadParametersUI/QualityPresets.tsx

/**
 * Quality Presets Component
 *
 * Provides quick preset buttons for common quality settings.
 * Supports video, audio, and image presets with visual feedback.
 *
 * Presets automatically configure multiple parameters at once
 * for a streamlined user experience.
 */

"use client";

import { useCallback, useMemo } from "react";
import { clsx } from "clsx";
import { Sparkles, Star, Zap, Gauge, HelpCircle, Check } from "lucide-react";
import type { MediaType } from "@/types";

export interface QualityPresetConfig {
  id: string;
  label: string;
  description: string;
  icon: "sparkles" | "star" | "zap" | "gauge";
  parameters: Record<string, unknown>;
  fileSizeIndicator: "smallest" | "small" | "medium" | "large" | "largest";
  qualityIndicator: "basic" | "good" | "great" | "excellent" | "maximum";
}

// Video quality presets
export const VIDEO_QUALITY_PRESETS: QualityPresetConfig[] = [
  {
    id: "low",
    label: "Low",
    description: "Smallest file size, basic quality",
    icon: "gauge",
    parameters: {
      quality: 28,
      preset: "faster",
    },
    fileSizeIndicator: "smallest",
    qualityIndicator: "basic",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced quality and size",
    icon: "zap",
    parameters: {
      quality: 23,
      preset: "medium",
    },
    fileSizeIndicator: "medium",
    qualityIndicator: "good",
  },
  {
    id: "high",
    label: "High",
    description: "Great quality, larger files",
    icon: "star",
    parameters: {
      quality: 20,
      preset: "slow",
    },
    fileSizeIndicator: "large",
    qualityIndicator: "great",
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "Maximum quality, largest files",
    icon: "sparkles",
    parameters: {
      quality: 18,
      preset: "slower",
    },
    fileSizeIndicator: "largest",
    qualityIndicator: "maximum",
  },
];

// Audio quality presets
export const AUDIO_QUALITY_PRESETS: QualityPresetConfig[] = [
  {
    id: "low",
    label: "Low",
    description: "Small files, acceptable for speech",
    icon: "gauge",
    parameters: {
      bitrate: "96k",
    },
    fileSizeIndicator: "smallest",
    qualityIndicator: "basic",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Good quality for most uses",
    icon: "zap",
    parameters: {
      bitrate: "128k",
    },
    fileSizeIndicator: "small",
    qualityIndicator: "good",
  },
  {
    id: "high",
    label: "High",
    description: "Great quality for music",
    icon: "star",
    parameters: {
      bitrate: "192k",
    },
    fileSizeIndicator: "medium",
    qualityIndicator: "great",
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "Maximum quality, largest files",
    icon: "sparkles",
    parameters: {
      bitrate: "320k",
    },
    fileSizeIndicator: "large",
    qualityIndicator: "maximum",
  },
];

// Image quality presets
export const IMAGE_QUALITY_PRESETS: QualityPresetConfig[] = [
  {
    id: "low",
    label: "Low",
    description: "Highly compressed, small files",
    icon: "gauge",
    parameters: {
      quality: 60,
    },
    fileSizeIndicator: "smallest",
    qualityIndicator: "basic",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Good balance for web",
    icon: "zap",
    parameters: {
      quality: 75,
    },
    fileSizeIndicator: "small",
    qualityIndicator: "good",
  },
  {
    id: "high",
    label: "High",
    description: "Minimal compression",
    icon: "star",
    parameters: {
      quality: 85,
    },
    fileSizeIndicator: "medium",
    qualityIndicator: "great",
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "Near-lossless quality",
    icon: "sparkles",
    parameters: {
      quality: 95,
    },
    fileSizeIndicator: "large",
    qualityIndicator: "maximum",
  },
];

// Get presets by media type
export function getPresetsForMediaType(mediaType: MediaType): QualityPresetConfig[] {
  switch (mediaType) {
    case "video":
      return VIDEO_QUALITY_PRESETS;
    case "audio":
      return AUDIO_QUALITY_PRESETS;
    case "image":
      return IMAGE_QUALITY_PRESETS;
    default:
      return [];
  }
}

// Icon component map
const iconComponents = {
  sparkles: Sparkles,
  star: Star,
  zap: Zap,
  gauge: Gauge,
};

// Quality indicator colors
const qualityColors: Record<QualityPresetConfig["qualityIndicator"], string> = {
  basic: "bg-gray-400",
  good: "bg-blue-400",
  great: "bg-green-400",
  excellent: "bg-purple-400",
  maximum: "bg-amber-400",
};

// File size indicator widths
const fileSizeWidths: Record<QualityPresetConfig["fileSizeIndicator"], string> = {
  smallest: "w-1/5",
  small: "w-2/5",
  medium: "w-3/5",
  large: "w-4/5",
  largest: "w-full",
};

export interface QualityPresetsProps {
  value?: string; // Currently selected preset ID
  currentParameters?: Record<string, unknown>; // Current parameter values
  onPresetSelect: (preset: QualityPresetConfig) => void;
  presets?: QualityPresetConfig[];
  mediaType?: MediaType;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  layout?: "horizontal" | "grid";
  showIndicators?: boolean;
  className?: string;
}

/**
 * Check if current parameters match a preset
 */
function matchesPreset(
  currentParams: Record<string, unknown>,
  presetParams: Record<string, unknown>
): boolean {
  for (const [key, value] of Object.entries(presetParams)) {
    if (currentParams[key] !== value) {
      return false;
    }
  }
  return true;
};


export function QualityPresets({
  value,
  currentParameters = {},
  onPresetSelect,
  presets: propPresets,
  mediaType,
  label = "Quality Preset",
  helperText,
  disabled = false,
  layout = "horizontal",
  showIndicators = true,
  className,
}: QualityPresetsProps) {
  // Get available presets
  const presets = useMemo(() => {
    if (propPresets) return propPresets;
    if (mediaType) return getPresetsForMediaType(mediaType);
    return VIDEO_QUALITY_PRESETS;
  }, [propPresets, mediaType]);

  // Find currently active preset (by ID or by matching parameters)
  const activePresetId = useMemo(() => {
    if (value) return value;
    
    for (const preset of presets) {
      if (matchesPreset(currentParameters, preset.parameters)) {
        return preset.id;
      }
    }
    
    return null;
  }, [value, currentParameters, presets]);

  
  const handlePresetClick = useCallback(
    (preset: QualityPresetConfig) => {
      if (disabled) return;
      onPresetSelect(preset);
    },
    [onPresetSelect, disabled]
  );

    
  return (
    <div className={clsx("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
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

      {/* Preset buttons */}
      <div
        className={clsx(
          layout === "horizontal"
            ? "flex flex-wrap gap-2"
            : "grid grid-cols-2 sm:grid-cols-4 gap-3"
        )}
      >
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const IconComponent = iconComponents[preset.icon];

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              className={clsx(
                "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                layout === "horizontal" ? "min-w-25" : "w-full",
                isActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {/* Selected indicator */}
              {isActive && (
                <div className="absolute top-1 right-1">
                  <Check className="h-4 w-4 text-blue-500" />
                </div>
              )}

              {/* Icon */}
              <IconComponent
                className={clsx(
                  "h-6 w-6 mb-1",
                  isActive ? "text-blue-500" : "text-gray-400"
                )}
              />

              {/* Label */}
              <span
                className={clsx(
                  "text-sm font-medium",
                  isActive ? "text-blue-700" : "text-gray-700"
                )}
              >
                {preset.label}
              </span>

              {/* Description */}
              <span className="text-xs text-gray-500 text-center mt-0.5">
                {preset.description}
              </span>

              {/* Indicators */}
              {showIndicators && (
                <div className="w-full mt-2 space-y-1">
                  {/* Quality indicator */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 w-10">Quality</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-300",
                          qualityColors[preset.qualityIndicator]
                        )}
                        style={{
                          width:
                            preset.qualityIndicator === "basic"
                              ? "25%"
                              : preset.qualityIndicator === "good"
                              ? "50%"
                              : preset.qualityIndicator === "great"
                              ? "75%"
                              : preset.qualityIndicator === "excellent"
                              ? "90%"
                              : "100%",
                        }}
                      />
                    </div>
                  </div>

                  {/* File size indicator */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 w-10">Size</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full bg-gray-400 rounded-full transition-all duration-300",
                          fileSizeWidths[preset.fileSizeIndicator]
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom indicator when no preset matches */}
      {!activePresetId && Object.keys(currentParameters).length > 0 && (
        <p className="text-xs text-gray-500 italic">
          Custom settings (no preset selected)
        </p>
      )}
    </div>
  );
};


export function VideoQualityPresets(
  props: Omit<QualityPresetsProps, "mediaType" | "presets">
) {
  return (
    <QualityPresets
      {...props}
      mediaType="video"
      label={props.label ?? "Video Quality"}
      helperText={props.helperText ?? "Choose a preset to configure quality and encoding settings"}
    />
  );
};


export function AudioQualityPresets(
  props: Omit<QualityPresetsProps, "mediaType" | "presets">
) {
  return (
    <QualityPresets
      {...props}
      mediaType="audio"
      label={props.label ?? "Audio Quality"}
      helperText={props.helperText ?? "Choose a preset to configure audio bitrate"}
    />
  );
};


export function ImageQualityPresets(
  props: Omit<QualityPresetsProps, "mediaType" | "presets">
) {
  return (
    <QualityPresets
      {...props}
      mediaType="image"
      label={props.label ?? "Image Quality"}
      helperText={props.helperText ?? "Choose a preset to configure compression level"}
    />
  );
};