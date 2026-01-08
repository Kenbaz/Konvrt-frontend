"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, AlertTriangle, Trash2, Info } from "lucide-react";
import { Button } from "./Button";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CONFIG: Record<
  ConfirmDialogVariant,
  {
    iconBg: string;
    iconColor: string;
    confirmVariant: "danger" | "primary" | "secondary";
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  danger: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    confirmVariant: "danger",
    Icon: Trash2,
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmVariant: "primary",
    Icon: AlertTriangle,
  },
  info: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmVariant: "primary",
    Icon: Info,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.Icon;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
  );

  const handleConfirm = useCallback(() => {
    if (!isLoading) {
      onConfirm();
    }
  }, [isLoading, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-[#1a1a1e] rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`shrink-0 p-3 rounded-full ${config.iconBg}`}>
              {icon || (
                <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 pt-1">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-300"
              >
                {title}
              </h3>
              <p
                id="confirm-dialog-description"
                className="mt-2 text-sm text-gray-400"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4  border-t border-gray-400">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer hover:text-gray-800"
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="cursor-pointer"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}


export interface UseConfirmDialogOptions {
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface UseConfirmDialogReturn {
  isOpen: boolean;
  isLoading: boolean;
  open: () => void;
  close: () => void;
  confirm: () => Promise<void>;
  dialogProps: {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
  };
}

import { useState } from "react";

export function useConfirmDialog(
  options: UseConfirmDialogOptions
): UseConfirmDialogReturn {
  const { onConfirm, onCancel } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
      onCancel?.();
    }
  }, [isLoading, onCancel]);

  const confirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm]);

  return {
    isOpen,
    isLoading,
    open,
    close,
    confirm,
    dialogProps: {
      isOpen,
      isLoading,
      onClose: close,
      onConfirm: confirm,
    },
  };
}
