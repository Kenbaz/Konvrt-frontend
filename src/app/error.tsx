// src/app/error.tsx

"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/UI/Button";
import { useState } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Log error to console in development
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  // Determine if this is a known error type
  const isNetworkError =
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("fetch");

  const isChunkError =
    error.message?.toLowerCase().includes("chunk") ||
    error.message?.toLowerCase().includes("loading");

  // Get user-friendly error message
  const getErrorMessage = (): string => {
    if (isNetworkError) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (isChunkError) {
      return "The application failed to load properly. This usually happens after an update. Please refresh the page.";
    }
    return "Something went wrong while loading this page. Please try again.";
  };

  // Get error title
  const getErrorTitle = (): string => {
    if (isNetworkError) {
      return "Connection Error";
    }
    if (isChunkError) {
      return "Loading Error";
    }
    return "Something Went Wrong";
  };

  const handleReset = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {getErrorTitle()}
            </h1>
            <p className="text-gray-600 text-sm">{getErrorMessage()}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleReset}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Try Again
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={handleRefresh}>
                Refresh Page
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={handleGoHome}
                leftIcon={<Home className="h-4 w-4" />}
              >
                Go Home
              </Button>
            </div>
          </div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="border-t">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span>Error Details</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showDetails && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-900 rounded-md p-4 overflow-auto max-h-64">
                    <p className="text-red-400 text-xs font-mono mb-2">
                      {error.name}: {error.message}
                    </p>
                    {error.stack && (
                      <pre className="text-gray-400 text-xs font-mono whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                    {error.digest && (
                      <p className="text-gray-500 text-xs font-mono mt-2">
                        Digest: {error.digest}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
