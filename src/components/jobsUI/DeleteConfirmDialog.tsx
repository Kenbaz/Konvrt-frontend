"use client";

import { useCallback } from "react";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import type { Job, JobListItem } from "@/types";

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  job?: Job | JobListItem | null;
  title?: string;
  message?: string;
}


function formatOperationName(operationName: string): string {
  return operationName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}


function getDeleteMessage(job?: Job | JobListItem | null): string {
  if (!job) {
    return "Are you sure you want to delete this operation? This action cannot be undone.";
  }

  const operationName = formatOperationName(job.operation);
  const hasOutput =
    ("has_output" in job && job.has_output) ||
    ("output_file" in job && job.output_file !== null);

  if (hasOutput && job.status === "completed") {
    return `Are you sure you want to delete this ${operationName} operation? The processed output file will also be deleted. This action cannot be undone.`;
  }

  if (job.status === "processing" || job.status === "queued") {
    return `Are you sure you want to delete this ${operationName} operation? The operation is currently ${job.status} and will be cancelled. This action cannot be undone.`;
  }

  return `Are you sure you want to delete this ${operationName} operation? This action cannot be undone.`;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  job,
  title = "Delete Operation",
  message,
}: DeleteConfirmDialogProps) {
  const displayMessage = message || getDeleteMessage(job);

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={displayMessage}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  );
}


export interface UseDeleteConfirmOptions {
  onDelete: (jobId: string) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseDeleteConfirmReturn {
  jobToDelete: Job | JobListItem | null;
  isOpen: boolean;
  isDeleting: boolean;
  confirmDelete: (job: Job | JobListItem) => void;
  cancelDelete: () => void;
  executeDelete: () => Promise<void>;
  dialogProps: {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
    job: Job | JobListItem | null;
  };
}

import { useState } from "react";

export function useDeleteConfirm(
  options: UseDeleteConfirmOptions
): UseDeleteConfirmReturn {
  const { onDelete, onSuccess, onError } = options;

  const [jobToDelete, setJobToDelete] = useState<Job | JobListItem | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((job: Job | JobListItem) => {
    setJobToDelete(job);
    setIsOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    if (!isDeleting) {
      setIsOpen(false);
      setJobToDelete(null);
    }
  }, [isDeleting]);

  const executeDelete = useCallback(async () => {
    if (!jobToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(jobToDelete.id);
      setIsOpen(false);
      setJobToDelete(null);
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Delete failed"));
    } finally {
      setIsDeleting(false);
    }
  }, [jobToDelete, isDeleting, onDelete, onSuccess, onError]);

  return {
    jobToDelete,
    isOpen,
    isDeleting,
    confirmDelete,
    cancelDelete,
    executeDelete,
    dialogProps: {
      isOpen,
      isLoading: isDeleting,
      onClose: cancelDelete,
      onConfirm: executeDelete,
      job: jobToDelete,
    },
  };
}
