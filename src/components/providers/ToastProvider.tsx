import { Toaster, toast, ToastOptions } from 'react-hot-toast';

const defaultToastOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
};

const toastStyles = {
  // Base styles applied to all toasts
  base: {
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  // Success toast styles
  success: {
    background: "#10b981",
    color: "#ffffff",
    iconTheme: {
      primary: "#ffffff",
      secondary: "#10b981",
    },
  },
  // Error toast styles
  error: {
    background: "#ef4444",
    color: "#ffffff",
    iconTheme: {
      primary: "#ffffff",
      secondary: "#ef4444",
    },
  },
  // Loading toast styles
  loading: {
    background: "#3b82f6",
    color: "#ffffff",
  },
};


export function ToastProvider() {
    return (
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          // Default options for all toasts
          duration: defaultToastOptions.duration,
          style: toastStyles.base,

          // Success toast configuration
          success: {
            duration: 3000,
            style: {
              ...toastStyles.base,
              ...toastStyles.success,
            },
            iconTheme: toastStyles.success.iconTheme,
          },

          // Error toast configuration
          error: {
            duration: 5000,
            style: {
              ...toastStyles.base,
              ...toastStyles.error,
            },
            iconTheme: toastStyles.error.iconTheme,
          },

          // Loading toast configuration
          loading: {
            style: {
              ...toastStyles.base,
              ...toastStyles.loading,
            },
          },
        }}
      />
    );
};


// Utility functions for showing toasts

export function showSuccessToast(message: string, options?: ToastOptions): string { 
    return toast.success(message, options);
};

export function showErrorToast(message: string, options?: ToastOptions): string { 
    return toast.error(message, options);
};


export function showInfoToast(message: string, options?: ToastOptions): string {
  return toast(message, {
    icon: "ℹ️",
    style: {
      ...toastStyles.base,
      background: "#3b82f6",
      color: "#ffffff",
    },
    ...options,
  });
};


export function showWarningToast(
  message: string,
  options?: ToastOptions
): string {
  return toast(message, {
    icon: "⚠️",
    style: {
      ...toastStyles.base,
      background: "#f59e0b",
      color: "#ffffff",
    },
    ...options,
  });
};


export function showLoadingToast(
  message: string,
  options?: ToastOptions
): string {
  return toast.loading(message, options);
};


export function updateToast(
  toastId: string,
  type: "success" | "error" | "loading",
  message: string
): void {
  if (type === "success") {
    toast.success(message, { id: toastId });
  } else if (type === "error") {
    toast.error(message, { id: toastId });
  } else {
    toast.loading(message, { id: toastId });
  }
};


export function dismissToast(toastId?: string): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};


export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: Error) => string);
  }
): Promise<T> {
  return toast.promise(promise, messages);
};