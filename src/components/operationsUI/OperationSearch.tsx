"use client";

import { useState, useCallback } from "react";
import {
  Video,
  Image as ImageIcon,
  Music,
  Layers,
} from "lucide-react";
// import { Input } from "../UI";
import { MediaType } from "@/types";

export type MediaTypeFilter = MediaType | "all";

export interface OperationSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mediaTypeFilter: MediaTypeFilter;
  onMediaTypeChange: (mediaType: MediaTypeFilter) => void;
  placeholder?: string;
  showMediaTypeFilter?: boolean;
  operationCounts?: {
    all: number;
    video: number;
    image: number;
    audio: number;
  };
  className?: string;
}

interface MediaTypeTab {
  type: MediaTypeFilter;
  label: string;
  icon: typeof Video;
}

const MEDIA_TYPE_TABS: MediaTypeTab[] = [
  { type: "all", label: "All", icon: Layers },
  { type: "video", label: "Video", icon: Video },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "audio", label: "Audio", icon: Music },
];

function TabIcon({
  type,
  className,
}: {
  type: MediaTypeFilter;
  className?: string;
}) {
  switch (type) {
    case "video":
      return <Video className={className} aria-hidden="true" />;
    case "image":
      return <ImageIcon className={className} aria-hidden="true" />;
    case "audio":
      return <Music className={className} aria-hidden="true" />;
    case "all":
    default:
      return <Layers className={className} aria-hidden="true" />;
  }
}

export function OperationSearch({
  searchQuery,
  // onSearchChange,
  mediaTypeFilter,
  onMediaTypeChange,
  // placeholder = "Search operations...",
  showMediaTypeFilter = true,
  operationCounts,
  className = "",
}: OperationSearchProps) {
  // const inputRef = useRef<HTMLInputElement>(null);
  // const [isFocused, setIsFocused] = useState(false);

  // const handleClearSearch = useCallback(() => {
  //   onSearchChange("");
  //   inputRef.current?.focus();
  // }, [onSearchChange]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.metaKey || e.ctrlKey) && e.key === "k") {
  //       e.preventDefault();
  //       inputRef.current?.focus();
  //     }

  //     if (e.key === "Escape" && isFocused) {
  //       if (searchQuery) {
  //         handleClearSearch();
  //       } else {
  //         inputRef.current?.blur();
  //       }
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [isFocused, searchQuery, handleClearSearch]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      {/* <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          leftIcon={<Search className="w-5 h-5" />}
          rightIcon={
            searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors pointer-events-auto"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-gray-400 bg-gray-100 rounded">
                <span className="text-xs">⌘</span>K
              </kbd>
            )
          }
          size="lg"
          aria-label="Search operations"
        />
      </div> */}

      {/* Media Type Filter Tabs */}
      {showMediaTypeFilter && (
        <div
          className="grid grid-cols-3 gap-2 md:grid-cols-4"
          role="tablist"
          aria-label="Filter by media type"
        >
          {MEDIA_TYPE_TABS.map((tab) => {
            const isActive = mediaTypeFilter === tab.type;
            const count = operationCounts?.[tab.type];

            return (
              <div
                key={tab.type}
                role="tab"
                aria-selected={isActive}
                onClick={() => onMediaTypeChange(tab.type)}
                className={`
                                    flex items-center gap-[8%] px-[8%] py-2 rounded-lg md:justify-between cursor-pointer
                                     transition-all duration-150
                                    focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2
                                    ${
                                      isActive
                                        ? "bg-[#6366f1] text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-[#818cf8] hover:text-white "
                                    }
                                `}
              >
                <button className="flex items-center gap-2">
                  <TabIcon type={tab.type} className="w-[30%] h-[30%] md:w-5 md:h-5" />
                  <span className="text-[80%] md:text-base font-medium">{tab.label}</span>
                </button>
                {count !== undefined && (
                  <span
                    className={`
                                            min-w-5 px-1.5 py-0.5 text-xs rounded-full md:text-sm
                                            ${
                                              isActive
                                                ? "bg-[#6366f1] text-blue-100"
                                                : "bg-gray-200 text-gray-600 hover:bg-[#818cf8] hover:text-white"
                                            }
                                        `}
                  >
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search Results Summary */}
      {searchQuery && (
        <p className="text-sm text-gray-500">
          Showing results for &ldquo;{searchQuery}&rdquo;
          {mediaTypeFilter !== "all" && ` in ${mediaTypeFilter}`}
        </p>
      )}
    </div>
  );
}

// Hook to manage operation search and filter state

export function useOperationSearch(initialMediaType: MediaTypeFilter = "all") {
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] =
    useState<MediaTypeFilter>(initialMediaType);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setMediaTypeFilter("all");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    mediaTypeFilter,
    setMediaTypeFilter,
    clearSearch,
    clearFilters,
    hasActiveFilters: searchQuery !== "" || mediaTypeFilter !== "all",
  };
}

// Filter operations based on search query and media type

export function filterOperations<
  T extends { operation_name: string; description: string; media_type: string }
>(operations: T[], searchQuery: string, mediaTypeFilter: MediaTypeFilter): T[] {
  return operations.filter((operation) => {
    // Apply media type filter
    if (mediaTypeFilter !== "all" && operation.media_type !== mediaTypeFilter) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = operation.operation_name.toLowerCase().includes(query);
      const descriptionMatch = operation.description
        .toLowerCase()
        .includes(query);
      // Also search in formatted name (e.g., "resize_image" -> "resize image")
      const formattedNameMatch = operation.operation_name
        .replace(/_/g, " ")
        .toLowerCase()
        .includes(query);

      return nameMatch || descriptionMatch || formattedNameMatch;
    }

    return true;
  });
}
