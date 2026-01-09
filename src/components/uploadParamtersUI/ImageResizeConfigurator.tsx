import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { clsx } from "clsx";
import {
  Image as ImageIcon,
  ArrowRight,
  Lock,
  Unlock,
  AlertCircle,
  Info,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { OperationDefinition } from "@/types/operation-types";
import { formatFileSize } from "@/lib/utils";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageResizeValues {
  width: number | undefined;
  height: number | undefined;
  maintain_aspect_ratio: boolean;
  resampling: string;
}

export interface ImageResizeConfiguratorProps {
  file: File;
  operation: OperationDefinition;
  initialValues?: Partial<ImageResizeValues>;
  onChange: (values: ImageResizeValues, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// Resampling method descriptions
const RESAMPLING_DESCRIPTIONS: Record<string, string> = {
  lanczos: "Highest quality, best for downscaling. Slower processing.",
  bicubic: "High quality, good balance of speed and quality.",
  bilinear: "Good quality, faster than bicubic.",
  nearest: "Fastest, but may produce pixelated results. Best for pixel art.",
};


// Custom hook to read image dimensions from a File
function useImageDimensions(file: File): {
  dimensions: ImageDimensions | null;
  loading: boolean;
  error: string | null;
} {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDimensions(null);
    setLoading(true);
    setError(null);

    let mounted = true;
    let url: string | null = null;

    try {
      url = URL.createObjectURL(file);
      const img = new window.Image();

      img.onload = () => {
        if (mounted) {
          setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setLoading(false);
          setError(null);
        }
      };

      img.onerror = () => {
        if (mounted) {
          setError("Failed to load image dimensions");
          setLoading(false);
        }
      };

      img.src = url;
    } catch {
      if (mounted) {
        setError("Failed to create image preview");
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  return { dimensions, loading, error };
}


function useFilePreviewUrl(file: File): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    try {
      url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(url);
    } catch (err) {
      console.error("Failed to create preview URL:", err);
      setPreviewUrl(null);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  return previewUrl;
}

// Calculate new dimensions while maintaining aspect ratio
function calculateAspectRatioDimensions(
  original: ImageDimensions,
  targetWidth: number | undefined,
  targetHeight: number | undefined,
  maintainAspectRatio: boolean
): { width: number | undefined; height: number | undefined } {
  if (!maintainAspectRatio) {
    return { width: targetWidth, height: targetHeight };
  }

  const aspectRatio = original.width / original.height;

  if (targetWidth !== undefined && targetHeight === undefined) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  if (targetHeight !== undefined && targetWidth === undefined) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }

  if (targetWidth !== undefined && targetHeight !== undefined) {
    const widthRatio = targetWidth / original.width;
    const heightRatio = targetHeight / original.height;
    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: Math.round(original.width * ratio),
      height: Math.round(original.height * ratio),
    };
  }

  return { width: original.width, height: original.height };
}


function calculatePercentageChange(original: number, newValue: number): number {
  return ((newValue - original) / original) * 100;
}


function formatDimensionChange(
  original: number,
  newValue: number
): { text: string; isIncrease: boolean; isDecrease: boolean } {
  const change = calculatePercentageChange(original, newValue);
  const absChange = Math.abs(change);

  if (absChange < 0.5) {
    return { text: "No change", isIncrease: false, isDecrease: false };
  }

  const sign = change > 0 ? "+" : "";
  return {
    text: `${sign}${change.toFixed(1)}%`,
    isIncrease: change > 0,
    isDecrease: change < 0,
  };
}

export function ImageResizeConfigurator({
  file,
  initialValues,
  onChange,
  disabled = false,
  className,
}: ImageResizeConfiguratorProps) {
  // Read original image dimensions
  const { dimensions: originalDimensions, loading: dimensionsLoading, error: dimensionsError } =
    useImageDimensions(file);

  const previewUrl = useFilePreviewUrl(file);

  // Form state
  const [width, setWidth] = useState<number | undefined>(initialValues?.width);
  const [height, setHeight] = useState<number | undefined>(initialValues?.height);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(
    initialValues?.maintain_aspect_ratio ?? true
  );
  const [resampling, setResampling] = useState<string>(
    initialValues?.resampling ?? "lanczos"
  );

  const lastEditedField = useRef<"width" | "height" | null>(null);

  const calculatedDimensions = useMemo(() => {
    if (!originalDimensions) return { width: undefined, height: undefined };

    return calculateAspectRatioDimensions(
      originalDimensions,
      width,
      height,
      maintainAspectRatio
    );
  }, [originalDimensions, width, height, maintainAspectRatio]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (width === undefined && height === undefined) {
      errors.push("At least one of width or height must be specified");
    }

    if (width !== undefined) {
      if (width < 1) errors.push("Width must be at least 1 pixel");
      if (width > 16384) errors.push("Width cannot exceed 16384 pixels");
    }

    if (height !== undefined) {
      if (height < 1) errors.push("Height must be at least 1 pixel");
      if (height > 16384) errors.push("Height cannot exceed 16384 pixels");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [width, height]);

  useEffect(() => {
    onChange(
      {
        width,
        height,
        maintain_aspect_ratio: maintainAspectRatio,
        resampling,
      },
      validation.isValid
    );
  }, [width, height, maintainAspectRatio, resampling, validation.isValid, onChange]);

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
      if (value === undefined || !isNaN(value)) {
        lastEditedField.current = "width";
        setWidth(value);
      }
    },
    []
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
      if (value === undefined || !isNaN(value)) {
        lastEditedField.current = "height";
        setHeight(value);
      }
    },
    []
  );

  const handleAspectRatioToggle = useCallback(() => {
    setMaintainAspectRatio((prev) => !prev);
  }, []);

  const handleResamplingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setResampling(e.target.value);
    },
    []
  );

  // Set dimensions to original
  const handleResetToOriginal = useCallback(() => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
  }, [originalDimensions]);

    
  const scalePresets = useMemo(() => {
    if (!originalDimensions) return [];
    return [
      { label: "25%", factor: 0.25 },
      { label: "50%", factor: 0.5 },
      { label: "75%", factor: 0.75 },
      { label: "100%", factor: 1 },
      { label: "150%", factor: 1.5 },
      { label: "200%", factor: 2 },
    ];
  }, [originalDimensions]);

  const handleScalePreset = useCallback(
    (factor: number) => {
      if (originalDimensions) {
        setWidth(Math.round(originalDimensions.width * factor));
        setHeight(Math.round(originalDimensions.height * factor));
      }
    },
    [originalDimensions]
  );

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Image Preview Section */}
      <div className="bg-[#1a1a1e] rounded-lg border border-gray-900 overflow-hidden">
        {/* Preview Header */}
        <div className="px-4 py-3 border-b border-gray-900 bg-[#121214]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-300">
                Image Preview
              </span>
            </div>
            <span className="text-xs text-gray-300">
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>

        {/* Preview Image */}
        <div className="relative bg-[#1a1a1e] flex items-center justify-center p-4">
          <div className="relative max-h-64 overflow-hidden rounded-md shadow-sm">
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-64 w-auto object-contain"
                style={{ maxWidth: "100%" }}
              />
            ) : (
              <div className="h-48 w-64 bg-[#1a1a1e] flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Original Dimensions */}
        <div className="px-4 py-3 bg-[#121214] border-t border-gray-900">
          {dimensionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="h-4 w-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
              Reading image dimensions...
            </div>
          ) : dimensionsError ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {dimensionsError}
            </div>
          ) : originalDimensions ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                  Original Size
                </span>
                <p className="text-lg font-semibold text-gray-400">
                  {originalDimensions.width} × {originalDimensions.height}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    px
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetToOriginal}
                disabled={disabled}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 cursor-pointer"
              >
                Use original size
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Dimension Inputs */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Target Dimensions</h4>

        {/* Quick Scale Presets */}
        {originalDimensions && (
          <div className="flex flex-wrap gap-2">
            {scalePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleScalePreset(preset.factor)}
                disabled={disabled}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                  "border border-gray-300 bg-[#FFFFFFDE] text-gray-700",
                  "hover:bg-gray-50 hover:border-gray-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  preset.factor < 1 &&
                    "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700",
                  preset.factor > 1 &&
                    "hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                )}
              >
                {preset.factor < 1 && (
                  <ZoomOut className="h-3 w-3 inline mr-1" />
                )}
                {preset.factor > 1 && (
                  <ZoomIn className="h-3 w-3 inline mr-1" />
                )}
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {/* Width and Height Inputs */}
        <div className="grid grid-cols-2 gap-4">
          {/* Width Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="resize-width"
              className="block text-sm font-medium text-gray-300"
            >
              Width <span className="text-gray-400">(px)</span>
            </label>
            <input
              id="resize-width"
              type="number"
              min={1}
              max={16384}
              value={width ?? ""}
              onChange={handleWidthChange}
              disabled={disabled}
              placeholder={
                originalDimensions ? String(originalDimensions.width) : "Width"
              }
              className={clsx(
                "block w-full rounded-lg border px-3 py-2 text-sm",
                "bg-[#1a1a1e] text-gray-300 placeholder:text-gray-400",
                "transition-colors duration-200 cursor-pointer",
                "focus:outline-none",
                "border-[#1a1a1e] hover:border-gray-400  focus:ring-gray-500",
                "disabled:bg-gray-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {/* Height Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="resize-height"
              className="block text-sm font-medium text-gray-300"
            >
              Height <span className="text-gray-400">(px)</span>
            </label>
            <input
              id="resize-height"
              type="number"
              min={1}
              max={16384}
              value={height ?? ""}
              onChange={handleHeightChange}
              disabled={disabled}
              placeholder={
                originalDimensions
                  ? String(originalDimensions.height)
                  : "Height"
              }
              className={clsx(
                "block w-full rounded-lg border px-3 py-2 text-sm",
                "bg-[#1a1a1e] text-gray-300 placeholder:text-gray-400",
                "transition-colors duration-200 cursor-pointer",
                "focus:outline-none",
                "border-[#1a1a1e] hover:border-gray-400  focus:ring-gray-500",
                "disabled:bg-gray-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {/* Aspect Ratio Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAspectRatioToggle}
            disabled={disabled}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              maintainAspectRatio
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-gray-50 text-gray-600 border border-gray-200",
              "hover:bg-opacity-80",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {maintainAspectRatio ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            {maintainAspectRatio
              ? "Aspect ratio locked"
              : "Aspect ratio unlocked"}
          </button>
          {maintainAspectRatio && originalDimensions && (
            <span className="text-xs text-gray-400">
              Ratio:{" "}
              {(originalDimensions.width / originalDimensions.height).toFixed(
                2
              )}
              :1
            </span>
          )}
        </div>

        {/* Resampling Method */}
        <div className="space-y-1.5">
          <label
            htmlFor="resize-resampling"
            className="block text-sm font-medium text-gray-300"
          >
            Resampling Method
          </label>
          <select
            id="resize-resampling"
            value={resampling}
            onChange={handleResamplingChange}
            disabled={disabled}
            className={clsx(
              "block w-full rounded-lg border px-3 py-2 text-sm",
              "bg-[#1a1a1e] text-gray-400",
              "transition-colors duration-200 cursor-pointer",
              "focus:outline-none",
              "border-[#1a1a1e] hover:border-gray-400  focus:ring-gray-500",
              "disabled:bg-gray-50 disabled:cursor-not-allowed"
            )}
          >
            <option value="lanczos">Lanczos (Highest Quality)</option>
            <option value="bicubic">Bicubic (High Quality)</option>
            <option value="bilinear">Bilinear (Good Quality)</option>
            <option value="nearest">Nearest (Fastest)</option>
          </select>
          <p className="text-xs text-gray-400">
            {RESAMPLING_DESCRIPTIONS[resampling]}
          </p>
        </div>
      </div>

      {/* Dimension Comparison */}
      {originalDimensions &&
        (calculatedDimensions.width || calculatedDimensions.height) && (
          <div className="bg-[#1a1a1e] rounded-lg border border-[#1a1a1e] p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Size Comparison
            </h4>

            <div className="flex items-center justify-between gap-4">
              {/* Original */}
              <div className="flex-1 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Original
                </span>
                <p className="text-lg font-semibold text-gray-300 mt-1">
                  {originalDimensions.width} × {originalDimensions.height}
                </p>
                <p className="text-xs text-gray-400">
                  {(
                    (originalDimensions.width * originalDimensions.height) /
                    1000000
                  ).toFixed(2)}{" "}
                  MP
                </p>
              </div>

              {/* Arrow */}
              <div className="shrink-0">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>

              {/* New */}
              <div className="flex-1 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  New Size
                </span>
                <p className="text-lg font-semibold text-blue-700 mt-1">
                  {calculatedDimensions.width ?? "—"} ×{" "}
                  {calculatedDimensions.height ?? "—"}
                </p>
                {calculatedDimensions.width && calculatedDimensions.height && (
                  <p className="text-xs text-gray-400">
                    {(
                      (calculatedDimensions.width *
                        calculatedDimensions.height) /
                      1000000
                    ).toFixed(2)}{" "}
                    MP
                  </p>
                )}
              </div>
            </div>

            {/* Change indicators */}
            {calculatedDimensions.width && calculatedDimensions.height && (
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
                {/* Width change */}
                <div className="text-center">
                  <span className="text-xs text-gray-400">Width</span>
                  {(() => {
                    const change = formatDimensionChange(
                      originalDimensions.width,
                      calculatedDimensions.width
                    );
                    return (
                      <p
                        className={clsx(
                          "text-sm font-medium",
                          change.isIncrease && "text-green-600",
                          change.isDecrease && "text-orange-600",
                          !change.isIncrease &&
                            !change.isDecrease &&
                            "text-gray-400"
                        )}
                      >
                        {change.text}
                      </p>
                    );
                  })()}
                </div>

                {/* Height change */}
                <div className="text-center">
                  <span className="text-xs text-gray-400">Height</span>
                  {(() => {
                    const change = formatDimensionChange(
                      originalDimensions.height,
                      calculatedDimensions.height
                    );
                    return (
                      <p
                        className={clsx(
                          "text-sm font-medium",
                          change.isIncrease && "text-green-600",
                          change.isDecrease && "text-orange-600",
                          !change.isIncrease &&
                            !change.isDecrease &&
                            "text-gray-400"
                        )}
                      >
                        {change.text}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Validation Errors */}
      {width &&
        height &&
        !validation.isValid &&
        validation.errors.length > 0 && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  Please fix the following:
                </h4>
                <ul className="mt-2 text-sm text-red-700 list-disc pl-5 space-y-1">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}