// src/components/uploadParamtersUI/BitrateSlider.tsx

/**
 * Bitrate/Quality Slider Component
 *
 * A specialized slider component for selecting video/audio quality.
 * Provides visual feedback with quality labels and estimated file sizes.
 *
 * Supports two modes:
 * - CRF mode (for video quality): 18-28, lower = better quality
 * - Bitrate mode (for audio): Common bitrates like 128k, 192k, 320k
 */

'use client';

import { useId, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import { Gauge, AlertCircle, HelpCircle } from "lucide-react";

export interface QualityPreset {
    value: number;
    label: string;
    description: string;
    fileSize: string;
};

export const VIDEO_QUALITY_PRESETS: QualityPreset[] = [
  {
    value: 18,
    label: "Ultra",
    description: "Visually lossless",
    fileSize: "Very Large",
  },
  {
    value: 20,
    label: "High",
    description: "Excellent quality",
    fileSize: "Large",
  },
  {
    value: 23,
    label: "Medium",
    description: "Good balance",
    fileSize: "Medium",
  },
  {
    value: 26,
    label: "Low",
    description: "Acceptable quality",
    fileSize: "Small",
  },
  {
    value: 28,
    label: "Minimum",
    description: "Basic quality",
    fileSize: "Very Small",
  },
];

export interface AudioBitratePreset {
    value: string;
    numericValue: number;
    label: string;
    description: string;
};

export const AUDIO_BITRATE_PRESETS: AudioBitratePreset[] = [
  {
    value: "64k",
    numericValue: 64,
    label: "64 kbps",
    description: "Low quality, small files",
  },
  {
    value: "96k",
    numericValue: 96,
    label: "96 kbps",
    description: "Acceptable for speech",
  },
  {
    value: "128k",
    numericValue: 128,
    label: "128 kbps",
    description: "Standard quality",
  },
  {
    value: "192k",
    numericValue: 192,
    label: "192 kbps",
    description: "Good quality",
  },
  {
    value: "256k",
    numericValue: 256,
    label: "256 kbps",
    description: "High quality",
  },
  {
    value: "320k",
    numericValue: 320,
    label: "320 kbps",
    description: "Maximum quality",
  },
];

export const IMAGE_QUALITY_PRESETS: QualityPreset[] = [
  {
    value: 100,
    label: "Maximum",
    description: "No compression",
    fileSize: "Very Large",
  },
  {
    value: 90,
    label: "High",
    description: "Minimal compression",
    fileSize: "Large",
  },
  { value: 85, label: "Good", description: "Recommended", fileSize: "Medium" },
  { value: 75, label: "Medium", description: "Balanced", fileSize: "Small" },
  {
    value: 60,
    label: "Low",
    description: "High compression",
    fileSize: "Very Small",
  },
];

export type QualityMode = 'video-crf' | 'audio-bitrate' | 'image-quality';

export interface BitrateSliderProps {
  value: number | string;
  onChange: (value: number | string) => void;
  mode?: QualityMode;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  showPresets?: boolean;
  showValueLabel?: boolean;
  className?: string;
};


function getModeConfig(mode: QualityMode) {
    switch (mode) {
      case "video-crf":
        return {
          min: 18,
          max: 28,
          step: 1,
          presets: VIDEO_QUALITY_PRESETS,
          isInverted: true, // Lower is better
          formatValue: (v: number) => v.toString(),
          parseValue: (v: string | number) =>
            typeof v === "string" ? parseInt(v, 10) : v,
        };
      case "audio-bitrate":
        return {
          min: 64,
          max: 320,
          step: 32,
          presets: AUDIO_BITRATE_PRESETS.map((p) => ({
            value: p.numericValue,
            label: p.label,
            description: p.description,
            fileSize: "",
          })),
          isInverted: false, // Higher is better
          formatValue: (v: number) => `${v}k`,
          parseValue: (v: string | number) => {
            if (typeof v === "string") {
              return parseInt(v.replace("k", ""), 10);
            }
            return v;
          },
        };
      case "image-quality":
        return {
          min: 1,
          max: 100,
          step: 1,
          presets: IMAGE_QUALITY_PRESETS,
          isInverted: false, // Higher is better
          formatValue: (v: number) => v.toString(),
          parseValue: (v: string | number) =>
            typeof v === "string" ? parseInt(v, 10) : v,
        };
      default:
        return {
          min: 0,
          max: 100,
          step: 1,
          presets: [],
          isInverted: false,
          formatValue: (v: number) => v.toString(),
          parseValue: (v: string | number) =>
            typeof v === "string" ? parseInt(v, 10) : v,
        };
    }
};


function getQualityLabel(value: number, mode: QualityMode): { label: string; color: string } {
  const config = getModeConfig(mode);
  const { min, max, isInverted } = config;
  
  // Normalize value to 0-1 range
  let normalized = (value - min) / (max - min);
  if (isInverted) normalized = 1 - normalized;
  
  if (normalized >= 0.8) {
    return { label: "Excellent", color: "text-green-600" };
  } else if (normalized >= 0.6) {
    return { label: "Good", color: "text-blue-600" };
  } else if (normalized >= 0.4) {
    return { label: "Medium", color: "text-yellow-600" };
  } else if (normalized >= 0.2) {
    return { label: "Low", color: "text-orange-600" };
  } else {
    return { label: "Minimum", color: "text-red-600" };
  }
};


export function BitrateSlider({
  value,
  onChange,
  mode = "video-crf",
  min: propMin,
  max: propMax,
  step: propStep,
  label = "Quality",
  helperText,
  error,
  disabled = false,
  showPresets = true,
  showValueLabel = true,
  className,
}: BitrateSliderProps) {
  const generatedId = useId();
  const sliderId = `slider-${generatedId}`;
  const errorId = `${sliderId}-error`;
  const helperId = `${sliderId}-helper`;
  const hasError = Boolean(error);

  // Get mode configuration
  const config = useMemo(() => getModeConfig(mode), [mode]);

  const min = propMin ?? config.min;
  const max = propMax ?? config.max;
  const step = propStep ?? config.step;

  // Parse current value to numeric
  const numericValue = useMemo(() => {
    return config.parseValue(value);
  }, [value, config]);

  // Get quality label
  const qualityInfo = useMemo(() => {
    return getQualityLabel(numericValue, mode);
  }, [numericValue, mode]);

  // Handle slider change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumericValue = parseInt(e.target.value, 10);

      // For audio bitrate, convert back to string format
      if (mode === "audio-bitrate") {
        onChange(`${newNumericValue}k`);
      } else {
        onChange(newNumericValue);
      }
    },
    [onChange, mode]
  );

  // Handle preset click
  const handlePresetClick = useCallback(
    (presetValue: number) => {
      if (disabled) return;

      if (mode === "audio-bitrate") {
        onChange(`${presetValue}k`);
      } else {
        onChange(presetValue);
      }
    },
    [onChange, mode, disabled]
  );

  // Calculate slider background gradient for visual feedback
  const sliderBackground = useMemo(() => {
    const percentage = ((numericValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  }, [numericValue, min, max]);

  const ariaDescribedBy = hasError
    ? errorId
    : helperText
    ? helperId
    : undefined;

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Header with label and value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor={sliderId}
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

        {showValueLabel && (
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {config.formatValue(numericValue)}
            </span>
            <span className={clsx("text-xs font-medium", qualityInfo.color)}>
              ({qualityInfo.label})
            </span>
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={numericValue}
          aria-valuetext={`${config.formatValue(numericValue)} - ${
            qualityInfo.label
          }`}
          style={{ background: sliderBackground }}
          className={clsx(
            "w-full h-2 rounded-lg appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-5",
            "[&::-webkit-slider-thumb]:w-5",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:border-2",
            "[&::-webkit-slider-thumb]:border-blue-500",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:h-5",
            "[&::-moz-range-thumb]:w-5",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-white",
            "[&::-moz-range-thumb]:border-2",
            "[&::-moz-range-thumb]:border-blue-500",
            "[&::-moz-range-thumb]:shadow-md",
            "[&::-moz-range-thumb]:cursor-pointer",
            hasError && "ring-2 ring-red-500 ring-offset-2"
          )}
        />

        {/* Min/Max labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{config.isInverted ? "Best" : "Low"}</span>
          <span>{config.isInverted ? "Lower" : "Best"}</span>
        </div>
      </div>

      {/* Preset buttons */}
      {showPresets && config.presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.presets.map((preset) => {
            const isSelected = numericValue === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetClick(preset.value)}
                disabled={disabled}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-full",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                title={preset.description}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Current preset description */}
      {showPresets && (
        <p className="text-xs text-gray-500">
          {(() => {
            const currentPreset = config.presets.find(
              (p) => p.value === numericValue
            );
            if (currentPreset) {
              return (
                <>
                  <span className="font-medium">{currentPreset.label}:</span>{" "}
                  {currentPreset.description}
                  {currentPreset.fileSize &&
                    ` • File size: ${currentPreset.fileSize}`}
                </>
              );
            }
            return `Custom value: ${config.formatValue(numericValue)}`;
          })()}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span id={errorId} role="alert">
            {error}
          </span>
        </div>
      )}
    </div>
  );
};


export function VideoQualitySlider(
  props: Omit<BitrateSliderProps, "mode" | "min" | "max" | "step">
) {
  return (
    <BitrateSlider
      {...props}
      mode="video-crf"
      label={props.label ?? "Video Quality"}
      helperText={
        props.helperText ?? "Lower values = better quality, larger files"
      }
    />
  );
};


export function AudioBitrateSlider(
  props: Omit<BitrateSliderProps, "mode" | "min" | "max" | "step">
) {
  return (
    <BitrateSlider
      {...props}
      mode="audio-bitrate"
      label={props.label ?? "Audio Bitrate"}
      helperText={
        props.helperText ?? "Higher values = better quality, larger files"
      }
    />
  );
};


export function ImageQualitySlider(
  props: Omit<BitrateSliderProps, "mode" | "min" | "max" | "step">
) {
  return (
    <BitrateSlider
      {...props}
      mode="image-quality"
      label={props.label ?? "Image Quality"}
      helperText={
        props.helperText ?? "Higher values = better quality, larger files"
      }
    />
  );
};