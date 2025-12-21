// src/components/operationsUI/OperationCard.tsx

/**
 * Displays a single operation as a selectable card with:
 * - Operation name (formatted for display)
 * - Description
 * - Media type badge
 * - Visual feedback for selection and hover states
 */

'use client';

import { Video, Image as ImageIcon, Music, FileQuestion } from "lucide-react";
import { Card, Badge } from "../UI";
import type { OperationDefinition, MediaType } from "@/types";
import { getOperationDisplayName, getMediaTypeColorClasses } from "@/lib/api/operations";


function MediaTypeIcon({
  mediaType,
  className,
}: {
  mediaType: MediaType;
  className?: string;
}) {
  switch (mediaType) {
    case "video":
      return <Video className={className} aria-hidden="true" />;
    case "image":
      return <ImageIcon className={className} aria-hidden="true" />;
    case "audio":
      return <Music className={className} aria-hidden="true" />;
    default:
      return <FileQuestion className={className} aria-hidden="true" />;
  }
}


function getMediaTypeBadgeVariant(
  mediaType: MediaType
): "default" | "primary" | "success" | "warning" | "danger" | "info" {
  const variants: Record<
    MediaType,
    "default" | "primary" | "success" | "warning" | "danger" | "info"
  > = {
    video: "primary",
    image: "info",
    audio: "success",
  };
  return variants[mediaType] ?? "default";
};


export interface OperationCardProps { 
    operation: OperationDefinition;
    isSelected?: boolean;
    onSelect?: (operation: OperationDefinition) => void;
    disabled?: boolean;
    showFullDescription?: boolean;
    className?: string;
};


export function OperationCard({
  operation,
  isSelected = false,
  onSelect,
  disabled = false,
  showFullDescription = false,
  className = "",
}: OperationCardProps) {
  const displayName = getOperationDisplayName(operation.operation_name);
  const colorClasses = getMediaTypeColorClasses(operation.media_type);
  const badgeVariant = getMediaTypeBadgeVariant(operation.media_type);

  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(operation);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  // Build dynamic class names for selection state
  const selectionClasses = isSelected
    ? `ring-2 ring-blue-500 ${colorClasses.bg}`
    : `${colorClasses.bgHover}`;

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <Card
      variant={isSelected ? "default" : "outlined"}
      padding="md"
      className={`
                transition-all duration-200 ease-in-out
                ${selectionClasses}
                ${disabledClasses}
                ${className}
            `.trim()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
                        shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                        ${colorClasses.bg} ${colorClasses.text}
                    `}
        >
          <MediaTypeIcon mediaType={operation.media_type} className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with name and badge */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            <Badge variant={badgeVariant} size="sm" className="shrink-0">
              {operation.media_type}
            </Badge>
          </div>

          {/* Description */}
          <p
            className={`
                            text-sm text-gray-600
                            ${showFullDescription ? "" : "line-clamp-2"}
                        `}
          >
            {operation.description}
          </p>

          {/* Supported formats hint (optional, show on hover or expanded) */}
          {operation.input_formats && operation.input_formats.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Supports: {operation.input_formats.slice(0, 5).join(", ")}
              {operation.input_formats.length > 5 &&
                ` +${operation.input_formats.length - 5} more`}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};


export function OperationCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Card
      variant="outlined"
      padding="md"
      className={`animate-pulse ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon skeleton */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-200" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-5 bg-gray-200 rounded w-12" />
          </div>

          {/* Description skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    </Card>
  );
};


/**
 * Compact version of OperationCard for use in lists or smaller spaces.
 */
export function OperationCardCompact({
    operation,
    isSelected = false,
    onSelect,
    disabled = false,
    className = '',
}: Omit<OperationCardProps, 'showFullDescription'>) {
    const displayName = getOperationDisplayName(operation.operation_name);
    const colorClasses = getMediaTypeColorClasses(operation.media_type);

    const handleClick = () => {
        if (!disabled && onSelect) {
            onSelect(operation);
        }
    };

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-pressed={isSelected}
            aria-disabled={disabled}
            className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all duration-150
                ${isSelected 
                    ? `border-blue-500 bg-blue-50 ring-1 ring-blue-500` 
                    : `border-gray-200 ${colorClasses.bgHover}`
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `.trim()}
        >
            <div
                className={`
                    shrink-0 w-8 h-8 rounded flex items-center justify-center
                    ${colorClasses.bg} ${colorClasses.text}
                `}
            >
                <MediaTypeIcon mediaType={operation.media_type} className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate block">
                    {displayName}
                </span>
            </div>

            {isSelected && (
                <div className="shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};
