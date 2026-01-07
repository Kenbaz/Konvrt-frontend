// src/components/uploadParamtersUI/BitrateSlider.tsx

/**
 * Bitrate/Quality Slider Component
 *
 * A specialized slider component for selecting video/audio quality.
 * Provides visual feedback with quality labels and estimated file sizes.
 *
 * Features:
 * - Smooth sliding experience
 * - Snaps to nearest valid value on release
 * - Visual tick marks for valid values
 * - Preset buttons for quick selection
 *
 * Supports three modes:
 * - CRF mode (for video quality): 18-28, lower = better quality
 * - Bitrate mode (for audio): Common bitrates like 128k, 192k, 320k
 * - Image quality mode: 1-100, higher = better quality
 */

'use client';

import { useState, useId, useCallback, useMemo, useRef } from "react";
import { clsx } from "clsx";
import { Gauge, AlertCircle, HelpCircle } from "lucide-react";

export interface QualityPreset {
  value: number;
  label: string;
  description: string;
  fileSize: string;
}

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
}

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
    value: "160k",
    numericValue: 160,
    label: "160 kbps",
    description: "Good quality",
  },
  {
    value: "192k",
    numericValue: 192,
    label: "192 kbps",
    description: "Great quality",
  },
  {
    value: "224k",
    numericValue: 224,
    label: "224 kbps",
    description: "High quality",
  },
  {
    value: "256k",
    numericValue: 256,
    label: "256 kbps",
    description: "Very high quality",
  },
  {
    value: "320k",
    numericValue: 320,
    label: "320 kbps",
    description: "Maximum quality",
  },
];

// Valid bitrate values for snapping
const VALID_BITRATES = [64, 96, 128, 160, 192, 224, 256, 320];

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
  showTickMarks?: boolean;
  className?: string;
}

interface ModeConfig {
  min: number;
  max: number;
  step: number;
  validValues: number[] | null; // null means continuous (any value is valid)
  presets: QualityPreset[];
  isInverted: boolean;
  formatValue: (v: number) => string;
  parseValue: (v: string | number) => number;
  snapToNearest: (v: number) => number;
}

function getModeConfig(mode: QualityMode): ModeConfig {
  switch (mode) {
    case "video-crf":
      return {
        min: 18,
        max: 28,
        step: 1,
        validValues: null, // Any integer 18-28 is valid
        presets: VIDEO_QUALITY_PRESETS,
        isInverted: true, // Lower is better
        formatValue: (v: number) => v.toString(),
        parseValue: (v: string | number) =>
          typeof v === "string" ? parseInt(v, 10) : v,
        snapToNearest: (v: number) => Math.round(v),
      };
    case "audio-bitrate":
      return {
        min: 64,
        max: 320,
        step: 1, // Smooth sliding with step=1
        validValues: VALID_BITRATES,
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
        snapToNearest: (v: number) => {
          // Find the closest valid bitrate
          let closest = VALID_BITRATES[0];
          let minDiff = Math.abs(v - closest);
          for (const bitrate of VALID_BITRATES) {
            const diff = Math.abs(v - bitrate);
            if (diff < minDiff) {
              minDiff = diff;
              closest = bitrate;
            }
          }
          return closest;
        },
      };
    case "image-quality":
      return {
        min: 1,
        max: 100,
        step: 1,
        validValues: null, // Any integer 1-100 is valid
        presets: IMAGE_QUALITY_PRESETS,
        isInverted: false, // Higher is better
        formatValue: (v: number) => v.toString(),
        parseValue: (v: string | number) =>
          typeof v === "string" ? parseInt(v, 10) : v,
        snapToNearest: (v: number) => Math.round(v),
      };
    default:
      return {
        min: 0,
        max: 100,
        step: 1,
        validValues: null,
        presets: [],
        isInverted: false,
        formatValue: (v: number) => v.toString(),
        parseValue: (v: string | number) =>
          typeof v === "string" ? parseInt(v, 10) : v,
        snapToNearest: (v: number) => Math.round(v),
      };
  }
}

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
}

export function BitrateSlider({
  value,
  onChange,
  mode = "video-crf",
  min: propMin,
  max: propMax,
  label = "Quality",
  helperText,
  error,
  disabled = false,
  showPresets = true,
  showValueLabel = true,
  showTickMarks = true,
  className,
}: BitrateSliderProps) {
  const generatedId = useId();
  const sliderId = `slider-${generatedId}`;
  const errorId = `${sliderId}-error`;
  const helperId = `${sliderId}-helper`;
  const hasError = Boolean(error);

  // Track if user is currently dragging
  const isDraggingRef = useRef(false);

  // Get mode configuration
  const config = useMemo(() => getModeConfig(mode), [mode]);

  const min = propMin ?? config.min;
  const max = propMax ?? config.max;

  // Parse current value to numeric
  const numericValue = useMemo(() => {
    return config.parseValue(value);
  }, [value, config]);

  // Internal state for smooth dragging (shows current drag position)
  const [dragValue, setDragValue] = useState<number | null>(null);

  // The displayed value (drag value while dragging, otherwise actual value)
  const displayedValue = dragValue ?? numericValue;

  // Get quality label based on displayed value
  const qualityInfo = useMemo(() => {
    return getQualityLabel(displayedValue, mode);
  }, [displayedValue, mode]);

  // Handle slider input (while dragging)
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      isDraggingRef.current = true;
      setDragValue(newValue);
    },
    []
  );

  // Handle slider change (on release / after dragging)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = parseInt(e.target.value, 10);
      const snappedValue = config.snapToNearest(rawValue);

      isDraggingRef.current = false;
      setDragValue(null);

      // For audio bitrate, convert back to string format
      if (mode === "audio-bitrate") {
        onChange(`${snappedValue}k`);
      } else {
        onChange(snappedValue);
      }
    },
    [onChange, mode, config]
  );

  // Handle mouse/touch end to ensure we snap
  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current && dragValue !== null) {
      const snappedValue = config.snapToNearest(dragValue);
      isDraggingRef.current = false;
      setDragValue(null);

      if (mode === "audio-bitrate") {
        onChange(`${snappedValue}k`);
      } else {
        onChange(snappedValue);
      }
    }
  }, [dragValue, config, mode, onChange]);

  // Handle preset click
  const handlePresetClick = useCallback(
    (presetValue: number) => {
      if (disabled) return;

      setDragValue(null);

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
    const percentage = ((displayedValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  }, [displayedValue, min, max]);

  // Calculate tick mark positions for valid values
  const tickMarks = useMemo(() => {
    if (!showTickMarks || !config.validValues) return null;

    return config.validValues.map((val) => ({
      value: val,
      position: ((val - min) / (max - min)) * 100,
      isActive: val === numericValue,
    }));
  }, [showTickMarks, config.validValues, min, max, numericValue]);

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
          {label && (
            <label
              htmlFor={sliderId}
              className="block text-sm font-medium text-gray-300"
            >
              {label}
            </label>
          )}
          {helperText && (
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute z-999 w-48 p-2 mt-1 text-xs text-white bg-[#1a1a1e] rounded-md shadow-lg left-0">
                {helperText}
                <div className="absolute -top-1 left-2 w-2 h-2 bg-[#1a1a1e] rotate-45" />
              </div>
            </div>
          )}
        </div>

        {showValueLabel && (
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400 min-w-15 text-right">
              {config.formatValue(displayedValue)}
            </span>
            <span className={clsx("text-xs font-medium min-w-17.5", qualityInfo.color)}>
              ({qualityInfo.label})
            </span>
          </div>
        )}
      </div>

      {/* Slider container */}
      <div className="relative pt-1 pb-4">
        {/* Tick marks for valid values */}
        {tickMarks && (
          <div className="absolute inset-x-0 top-3 h-2 pointer-events-none">
            {tickMarks.map((tick) => (
              <div
                key={tick.value}
                className={clsx(
                  "absolute w-1 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2",
                  tick.isActive ? "bg-blue-600" : "bg-gray-300"
                )}
                style={{ left: `${tick.position}%`, top: "50%" }}
              />
            ))}
          </div>
        )}

        {/* The actual slider */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={1}
          value={displayedValue}
          onInput={handleInput}
          onChange={handleChange}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onBlur={handlePointerUp}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={displayedValue}
          aria-valuetext={`${config.formatValue(displayedValue)} - ${qualityInfo.label}`}
          style={{ background: sliderBackground }}
          className={clsx(
            "w-full h-2 rounded-lg appearance-none cursor-pointer relative z-10",
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
            "[&::-webkit-slider-thumb]:duration-100",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-webkit-slider-thumb]:active:scale-95",
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

        {/* Value labels below slider */}
        {tickMarks && (
          <div className="absolute inset-x-0 top-6 pointer-events-none">
            {tickMarks.map((tick) => (
              <span
                key={tick.value}
                className={clsx(
                  "absolute text-[10px] transform -translate-x-1/2",
                  tick.isActive ? "text-blue-600 font-medium" : "text-gray-400"
                )}
                style={{ left: `${tick.position}%` }}
              >
                {tick.value}k
              </span>
            ))}
          </div>
        )}

        {/* Min/Max labels for non-tick modes */}
        {!tickMarks && (
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{config.isInverted ? "Best" : "Low"}</span>
            <span>{config.isInverted ? "Lower" : "Best"}</span>
          </div>
        )}
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
                  "px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer",
                  "transition-all duration-200",
                  "focus:outline-none",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected
                    ? "bg-[#1b64da] text-white shadow-sm"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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
        <p className="text-xs text-gray-400">
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
}

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
      showTickMarks={false}
    />
  );
}

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
      showTickMarks={true}
    />
  );
}

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
      showTickMarks={false}
    />
  );
}