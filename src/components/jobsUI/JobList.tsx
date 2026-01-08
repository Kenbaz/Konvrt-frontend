"use client";

import { memo, useCallback } from "react";
import { 
  RefreshCw, 
  Inbox,
  AlertCircle,
} from "lucide-react";
import { JobCard, CompactJobCard } from "./JobCard";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";
// import { Spinner } from "../UI/Spinner";
import { useRecentJobs } from "@/lib/hooks/useJobs";
import type { JobListItem, Job } from "@/types";
import { OperationStatus } from "@/types/common-types";

export interface JobListProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onJobClick?: (job: JobListItem) => void;
  onDownload?: (job: JobListItem) => void;
  onDelete?: (job: JobListItem) => void;
  onRetry?: (job: JobListItem) => void;
  showActions?: boolean;
  compact?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  highlightedJobId?: string;
  className?: string;
}

function JobListComponent({
  limit = 10,
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds default
  onJobClick,
  onDownload,
  onDelete,
  onRetry,
  showActions = true,
  compact = false,
  showHeader = true,
  headerTitle = "Recent Jobs",
  highlightedJobId,
  className = "",
}: JobListProps) {
  const {
    jobs,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    activeJobsCount,
    hasActiveJobs,
  } = useRecentJobs({
    limit,
    autoRefresh,
    refreshInterval,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
    
  const handleJobClick = useCallback(
    (job: JobListItem | Job) => {
      onJobClick?.(job as JobListItem);
    },
    [onJobClick]
  );

  const handleDownload = useCallback(
    (job: JobListItem | Job) => {
      onDownload?.(job as JobListItem);
    },
    [onDownload]
  );

  const handleDelete = useCallback(
    (job: JobListItem | Job) => {
      onDelete?.(job as JobListItem);
    },
    [onDelete]
  );

  const handleRetry = useCallback(
    (job: JobListItem | Job) => {
      onRetry?.(job as JobListItem);
    },
    [onRetry]
  );

  // Loading state - initial load
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <JobListHeader 
            title={headerTitle} 
            isRefreshing={false} 
            onRefresh={handleRefresh}
            activeCount={0}
          />
        )}
        <JobListSkeleton count={3} compact={compact} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <JobListHeader 
            title={headerTitle} 
            isRefreshing={isFetching} 
            onRefresh={handleRefresh}
            activeCount={0}
          />
        )}
        <JobListError 
          error={error} 
          onRetry={handleRefresh} 
        />
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <JobListHeader 
            title={headerTitle} 
            isRefreshing={isFetching} 
            onRefresh={handleRefresh}
            activeCount={0}
          />
        )}
        <JobListEmpty />
      </div>
    );
  }

  // Render job list
  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <JobListHeader 
          title={headerTitle} 
          isRefreshing={isFetching} 
          onRefresh={handleRefresh}
          activeCount={activeJobsCount}
          hasActiveJobs={hasActiveJobs}
        />
      )}

      <div className={compact ? "space-y-2" : "space-y-3"}>
        {jobs.map((job) =>
          compact ? (
            <CompactJobCard
              key={job.id}
              job={job}
              onClick={onJobClick}
            />
          ) : (
            <JobCard
              key={job.id}
              job={job}
              onClick={onJobClick ? handleJobClick : undefined}
              onDownload={onDownload ? handleDownload : undefined}
              onDelete={onDelete ? handleDelete : undefined}
              onRetry={onRetry ? handleRetry : undefined}
              showActions={showActions}
              highlighted={job.id === highlightedJobId}
            />
          )
        )}
      </div>

      {/* Show indicator when background fetching */}
      {/* {isFetching && !isLoading && (
        <div className="flex items-center justify-center text-sm text-muted-foreground py-2">
          <Spinner size="sm" className="mr-2" />
          Refreshing...
        </div>
      )} */}
    </div>
  );
}

export const JobList = memo(JobListComponent);

// Header component
interface JobListHeaderProps {
  title: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  activeCount: number;
  hasActiveJobs?: boolean;
}

function JobListHeader({ 
  title, 
  isRefreshing, 
  onRefresh, 
  activeCount,
  hasActiveJobs = false
}: JobListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {hasActiveJobs && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {activeCount} active
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-muted-foreground cursor-pointer hover:text-gray-800"
        leftIcon={
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
        }
      >
        Refresh
      </Button>
    </div>
  );
}

// Loading skeleton
interface JobListSkeletonProps {
  count?: number;
  compact?: boolean;
}

function JobListSkeleton({ count = 3, compact = false }: JobListSkeletonProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="animate-pulse">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-muted rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
            {!compact && (
              <div className="flex gap-2 pt-3 border-t">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Error state
interface JobListErrorProps {
  error: Error | null;
  onRetry: () => void;
}

function JobListError({ error, onRetry }: JobListErrorProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-destructive/10 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium mb-1">Failed to load jobs</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="hover:text-gray-800 cursor-pointer"
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Try Again
        </Button>
      </div>
    </Card>
  );
}

// Empty state
function JobListEmpty() {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No jobs yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first job to get started with media processing
        </p>
      </div>
    </Card>
  );
}

// Paginated Job List for full page views
export interface PaginatedJobListProps extends Omit<JobListProps, 'limit'> {
  pageSize?: number;
  initialPage?: number;
}

export function PaginatedJobList({
  pageSize = 10,
  // initialPage = 1,
  ...props
}: PaginatedJobListProps) {
  // const [currentPage, setCurrentPage] = useState(initialPage);

  return (
    <div className="space-y-4">
      <JobList 
        {...props} 
        limit={pageSize} 
        showHeader={props.showHeader ?? true}
      />
      
      {/* Pagination would go here */}
    </div>
  );
}


export interface JobsByStatusListProps {
  status: string;
  limit?: number;
  onJobClick?: (job: JobListItem) => void;
  showHeader?: boolean;
  className?: string;
}

export function JobsByStatusList({
  status,
  limit = 10,
  onJobClick,
  showHeader = true,
  className = "",
}: JobsByStatusListProps) {
  const statusLabels: Record<string, string> = {
    [OperationStatus.PENDING]: "Pending Jobs",
    [OperationStatus.QUEUED]: "Queued Jobs",
    [OperationStatus.PROCESSING]: "Processing Jobs",
    [OperationStatus.COMPLETED]: "Completed Jobs",
    [OperationStatus.FAILED]: "Failed Jobs",
  };

  return (
    <JobList
      limit={limit}
      onJobClick={onJobClick}
      showHeader={showHeader}
      headerTitle={statusLabels[status] || "Jobs"}
      className={className}
    />
  );
}

// Active jobs panel - shows only processing jobs
export interface ActiveJobsPanelProps {
  onJobClick?: (job: JobListItem) => void;
  className?: string;
}

export function ActiveJobsPanel({ onJobClick, className = "" }: ActiveJobsPanelProps) {
  const { activeJobs, isLoading, hasActiveJobs } = useRecentJobs({
    limit: 5,
    autoRefresh: true,
    refreshInterval: 3000, // Faster refresh for active jobs
  });

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground">Active Jobs</h3>
        <JobListSkeleton count={1} compact />
      </div>
    );
  }

  if (!hasActiveJobs) {
    return null; // Don't show panel if no active jobs
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Active Jobs</h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      </div>
      <div className="space-y-2">
        {activeJobs.map((job) => (
          <CompactJobCard 
            key={job.id} 
            job={job} 
            onClick={onJobClick}
          />
        ))}
      </div>
    </div>
  );
};

// Export sub-components for flexibility
export { JobListSkeleton, JobListError, JobListEmpty };