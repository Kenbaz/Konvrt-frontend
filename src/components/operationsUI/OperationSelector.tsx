// src/components/operationsUI/OperationSelector.tsx

/**
 * Container component that fetches and displays all available operations
 * grouped by media type (video, image, audio).
 * 
 * Features:
 * - Grouped display by media type
 * - Loading skeleton state
 * - Error state with retry option
 * - Empty state handling
 * - Operation selection callback
 */

'use client';

import { useMemo, useState } from "react";
import {
  Video,
  Image as ImageIcon,
  Music,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import {
    useGroupedOperations,
    hasGroupedOperations
} from "@/lib/hooks/useOperations";
import { OperationCard, OperationCardSkeleton } from "./OperationCard";
import { Card, Button } from "../UI";
import type { OperationDefinition, MediaType, GroupedOperations } from "@/types";
import {
  OperationSearch,
  useOperationSearch,
  filterOperations,
  type MediaTypeFilter,
} from "./OperationSearch";
import { OperationParametersPreview } from "./OperationParametersPreview";


function SectionIcon({ mediaType, className }: { mediaType: MediaType; className?: string; }) { 
    switch (mediaType) { 
        case "video":
            return <Video className={className} aria-hidden="true" />;
        case "image":
            return <ImageIcon className={className} aria-hidden="true" />;
        case "audio":
            return <Music className={className} aria-hidden="true" />;
        default:
            return null;
    };
};


interface MediaTypeSectionConfig {
    type: MediaType;
    title: string;
    emptyMessage: string;
};

const MEDIA_TYPE_SECTIONS: MediaTypeSectionConfig[] = [
    {
        type: "video",
        title: "Video Operations",
        emptyMessage: "No video operations available",
    },
    {
        type: "image",
        title: "Image Operations",
        emptyMessage: "No image operations available",
    },
    {
        type: "audio",
        title: "Audio Operations",
        emptyMessage: "No audio operations available",
    },
];


export interface OperationSelectorProps { 
    selectedOperation?: OperationDefinition | null;
    onSelectOperation?: (operation: OperationDefinition) => void;
    onConfirmSelection?: (operation: OperationDefinition) => void;
    mediaTypeFilter?: MediaType[];
    collapsible?: boolean;
    showDescriptions?: boolean;
    showSearch?: boolean;
    showParameterPreview?: boolean;
    className?: string;
};


export function OperationSelector({
  selectedOperation,
  onSelectOperation,
  onConfirmSelection,
  mediaTypeFilter,
  collapsible = false,
  showDescriptions = true,
//   showSearch = false,
  showParameterPreview = false,
  className = "",
}: OperationSelectorProps) {
  const {
    data: groupedOperations,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGroupedOperations();
  const [collapsedSections, setCollapsedSections] = useState<Set<MediaType>>(
    new Set()
  );

  // Toggle section collapse state
  const toggleSection = (mediaType: MediaType) => {
    if (!collapsible) return;

    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(mediaType)) {
        next.delete(mediaType);
      } else {
        next.add(mediaType);
      }
      return next;
    });
  };

  // Filter sections based on mediaTypeFilter prop
  const sectionsToShow = mediaTypeFilter
    ? MEDIA_TYPE_SECTIONS.filter((section) =>
        mediaTypeFilter.includes(section.type)
      )
    : MEDIA_TYPE_SECTIONS;

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        {sectionsToShow.map((section) => (
          <OperationSectionSkeleton
            key={section.type}
            title={section.title}
            mediaType={section.type}
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        className={className}
      />
    );
  }

  // Empty state (no operations at all)
  if (!hasGroupedOperations(groupedOperations)) {
    return <EmptyState className={className} />;
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Parameter Preview (when operation is selected) */}
      {showParameterPreview && selectedOperation && (
        <OperationParametersPreview
          operation={selectedOperation}
          onConfirm={
            onConfirmSelection
              ? () => onConfirmSelection(selectedOperation)
              : undefined
          }
          onClear={
            onSelectOperation
              ? () => onSelectOperation(null as unknown as OperationDefinition)
              : undefined
          }
          showFullParameters={true}
        />
      )}

      {/* Operation Sections */}
      {sectionsToShow.map((section) => {
        const operations = groupedOperations[section.type];
        const isCollapsed = collapsedSections.has(section.type);

        return (
          <OperationSection
            key={section.type}
            title={section.title}
            mediaType={section.type}
            operations={operations}
            emptyMessage={section.emptyMessage}
            selectedOperation={selectedOperation}
            onSelectOperation={onSelectOperation}
            isCollapsed={isCollapsed}
            onToggleCollapse={
              collapsible ? () => toggleSection(section.type) : undefined
            }
            showDescriptions={showDescriptions}
          />
        );
      })}
    </div>
  );
};


/**
 * Enhanced OperationSelector with integrated search and filter
 */
export interface OperationSelectorWithSearchProps extends Omit<OperationSelectorProps, 'showSearch' | 'mediaTypeFilter'> {
    /**
     * Initial media type filter
     */
    initialMediaTypeFilter?: MediaTypeFilter;
}

export function OperationSelectorWithSearch({
    selectedOperation,
    onSelectOperation,
    onConfirmSelection,
    collapsible = false,
    showDescriptions = true,
    showParameterPreview = true,
    initialMediaTypeFilter = 'all',
    className = '',
}: OperationSelectorWithSearchProps) {
    const { data: groupedOperations, isLoading, error, refetch, isRefetching } = useGroupedOperations();
    const {
        searchQuery,
        setSearchQuery,
        mediaTypeFilter,
        setMediaTypeFilter,
        hasActiveFilters,
    } = useOperationSearch(initialMediaTypeFilter);
    const [collapsedSections, setCollapsedSections] = useState<Set<MediaType>>(new Set());

    // Calculate operation counts for filter badges
    const operationCounts = useMemo(() => {
        if (!groupedOperations) {
            return { all: 0, video: 0, image: 0, audio: 0 };
        }
        return {
            all: groupedOperations.video.length + groupedOperations.image.length + groupedOperations.audio.length,
            video: groupedOperations.video.length,
            image: groupedOperations.image.length,
            audio: groupedOperations.audio.length,
        };
    }, [groupedOperations]);

    // Filter operations based on search and media type
    const filteredOperations = useMemo((): GroupedOperations | null => {
        if (!groupedOperations) return null;

        // If showing all and no search, return original
        if (mediaTypeFilter === 'all' && !searchQuery) {
            return groupedOperations;
        }

        // Filter each category
        const filterByType = (operations: OperationDefinition[]) =>
            filterOperations(operations, searchQuery, mediaTypeFilter);

        return {
            video: filterByType(groupedOperations.video),
            image: filterByType(groupedOperations.image),
            audio: filterByType(groupedOperations.audio),
        };
    }, [groupedOperations, searchQuery, mediaTypeFilter]);

    // Count filtered results
    const filteredCount = useMemo(() => {
        if (!filteredOperations) return 0;
        return filteredOperations.video.length + filteredOperations.image.length + filteredOperations.audio.length;
    }, [filteredOperations]);

    // Toggle section collapse state
    const toggleSection = (mediaType: MediaType) => {
        if (!collapsible) return;

        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(mediaType)) {
                next.delete(mediaType);
            } else {
                next.add(mediaType);
            }
            return next;
        });
    };

    // Clear selection handler
    const handleClearSelection = () => {
        if (onSelectOperation) {
            // Pass null to clear - the parent component should handle this
            onSelectOperation(null as unknown as OperationDefinition);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                {/* Search skeleton */}
                <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
                {/* Section skeletons */}
                {MEDIA_TYPE_SECTIONS.map(section => (
                    <OperationSectionSkeleton
                        key={section.type}
                        title={section.title}
                        mediaType={section.type}
                    />
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <ErrorState
                error={error}
                onRetry={() => refetch()}
                isRetrying={isRefetching}
                className={className}
            />
        );
    }

    // Empty state (no operations at all)
    if (!hasGroupedOperations(groupedOperations)) {
        return (
            <EmptyState className={className} />
        );
    }

    // Determine which sections to show based on filter
    const sectionsToShow = mediaTypeFilter === 'all'
        ? MEDIA_TYPE_SECTIONS
        : MEDIA_TYPE_SECTIONS.filter(s => s.type === mediaTypeFilter);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Search and Filter Controls */}
            <OperationSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                mediaTypeFilter={mediaTypeFilter}
                onMediaTypeChange={setMediaTypeFilter}
                operationCounts={operationCounts}
                showMediaTypeFilter={true}
            />

            {/* Parameter Preview (when operation is selected) */}
            {showParameterPreview && selectedOperation && (
                <OperationParametersPreview
                    operation={selectedOperation}
                    onConfirm={onConfirmSelection ? () => onConfirmSelection(selectedOperation) : undefined}
                    onClear={handleClearSelection}
                    showFullParameters={true}
                />
            )}

            {/* No results state */}
            {hasActiveFilters && filteredCount === 0 && (
                <NoResultsState
                    searchQuery={searchQuery}
                    mediaTypeFilter={mediaTypeFilter}
                />
            )}

            {/* Operation Sections */}
            {filteredOperations && filteredCount > 0 && sectionsToShow.map(section => {
                const operations = filteredOperations[section.type];
                const isCollapsed = collapsedSections.has(section.type);

                // Skip empty sections when filtering
                if (operations.length === 0 && hasActiveFilters) {
                    return null;
                }

                return (
                    <OperationSection
                        key={section.type}
                        title={section.title}
                        mediaType={section.type}
                        operations={operations}
                        emptyMessage={section.emptyMessage}
                        selectedOperation={selectedOperation}
                        onSelectOperation={onSelectOperation}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={collapsible ? () => toggleSection(section.type) : undefined}
                        showDescriptions={showDescriptions}
                    />
                );
            })}
        </div>
    );
};


/**
 * No results state when search/filter returns no matches
 */
function NoResultsState({
    searchQuery,
    mediaTypeFilter,
}: {
    searchQuery: string;
    mediaTypeFilter: MediaTypeFilter;
}) {
    return (
        <Card variant="outlined" padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No operations found
                    </h3>
                    <p className="text-sm text-gray-600">
                        {searchQuery ? (
                            <>
                                No operations match &ldquo;{searchQuery}&rdquo;
                                {mediaTypeFilter !== 'all' && ` in ${mediaTypeFilter}`}.
                            </>
                        ) : (
                            <>No {mediaTypeFilter} operations available.</>
                        )}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Try a different search term or filter.
                    </p>
                </div>
            </div>
        </Card>
    );
};


/**
 * Individual section for a media type
 */
interface OperationSectionProps {
    title: string;
    mediaType: MediaType;
    operations: OperationDefinition[];
    emptyMessage: string;
    selectedOperation?: OperationDefinition | null;
    onSelectOperation?: (operation: OperationDefinition) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    showDescriptions?: boolean;
}

function OperationSection({
    title,
    mediaType,
    operations,
    emptyMessage,
    selectedOperation,
    onSelectOperation,
    isCollapsed = false,
    onToggleCollapse,
    showDescriptions = true,
}: OperationSectionProps) {
    const hasOperations = operations.length > 0;

    return (
      <section
        aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {/* Section Header */}
        <div
          className={`
                    flex items-center gap-2 mb-4
                    ${onToggleCollapse ? "cursor-pointer select-none" : ""}
                `}
          onClick={onToggleCollapse}
          onKeyDown={(e) => {
            if (onToggleCollapse && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onToggleCollapse();
            }
          }}
          role={onToggleCollapse ? "button" : undefined}
          tabIndex={onToggleCollapse ? 0 : undefined}
          aria-expanded={onToggleCollapse ? !isCollapsed : undefined}
        >
          <SectionIcon
            mediaType={mediaType}
            className="w-5 h-5 md:w-6 md:h-6 text-gray-400"
          />
          <h2
            id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-lg font-semibold text-[#FFFFFFDE]"
          >
            {title}
          </h2>
          <span className="text-sm text-gray-400">({operations.length})</span>
          {onToggleCollapse && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isCollapsed ? "" : "rotate-180"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>

        {/* Section Content */}
        {!isCollapsed &&
          (hasOperations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operations.map((operation) => (
                <OperationCard
                  key={operation.operation_name}
                  operation={operation}
                  isSelected={
                    selectedOperation?.operation_name ===
                    operation.operation_name
                  }
                  onSelect={onSelectOperation}
                  showFullDescription={!showDescriptions ? false : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic py-4">{emptyMessage}</p>
          ))}
      </section>
    );
};


/**
 * Skeleton loader for a section while loading
 */
interface OperationSectionSkeletonProps {
    title: string;
    mediaType: MediaType;
    count?: number;
}

function OperationSectionSkeleton({ mediaType, count = 3 }: OperationSectionSkeletonProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <SectionIcon mediaType={mediaType} className="w-5 h-5 text-gray-300" />
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: count }).map((_, index) => (
                    <OperationCardSkeleton key={index} />
                ))}
            </div>
        </section>
    );
};


/**
 * Error state component
 */
interface ErrorStateProps {
    error: Error;
    onRetry: () => void;
    isRetrying?: boolean;
    className?: string;
}

function ErrorState({ error, onRetry, isRetrying = false, className = '' }: ErrorStateProps) {
    return (
        <Card variant="outlined" padding="lg" className={`text-center ${className}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Failed to load operations
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        {error.message || 'An unexpected error occurred while fetching operations.'}
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    {isRetrying ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};


/**
 * Empty state when no operations are available
 */
function EmptyState({ className = '' }: { className?: string }) {
    return (
        <Card variant="outlined" padding="lg" className={`text-center ${className}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-gray-400" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No operations available
                    </h3>
                    <p className="text-sm text-gray-600">
                        There are no media processing operations available at this time.
                        Please check back later or contact support if this persists.
                    </p>
                </div>
            </div>
        </Card>
    );
};


/**
 * Compact version of OperationSelector for smaller spaces.
 * Shows operations in a simple list without grouping.
 */
export function OperationSelectorCompact({
    selectedOperation,
    onSelectOperation,
    mediaTypeFilter,
    className = '',
}: Omit<OperationSelectorProps, 'collapsible' | 'showDescriptions'>) {
    const { data: groupedOperations, isLoading, error, refetch, isRefetching } = useGroupedOperations();

    if (isLoading) {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState
                error={error}
                onRetry={() => refetch()}
                isRetrying={isRefetching}
                className={className}
            />
        );
    }

    if (!hasGroupedOperations(groupedOperations)) {
        return <EmptyState className={className} />;
    }

    // Flatten all operations into a single list
    let allOperations: OperationDefinition[] = [];
    const typesToInclude = mediaTypeFilter ?? ['video', 'image', 'audio'] as MediaType[];
    
    for (const type of typesToInclude) {
        allOperations = [...allOperations, ...groupedOperations[type]];
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {allOperations.map(operation => (
                <OperationCard
                    key={operation.operation_name}
                    operation={operation}
                    isSelected={selectedOperation?.operation_name === operation.operation_name}
                    onSelect={onSelectOperation}
                    showFullDescription={false}
                />
            ))}
        </div>
    );
};