import { useEffect, useState } from "react";

export type ProgressStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

interface ProgressIndicatorProps {
  status: ProgressStatus;
  progress?: number; // 0-100 for upload progress
  message?: string;
  onComplete?: () => void;
  autoHideSuccess?: boolean; // Auto-hide success message after 3 seconds
}

/**
 * ProgressIndicator component displays upload progress, processing status,
 * and success messages
 */
export default function ProgressIndicator({
  status,
  progress = 0,
  message,
  onComplete,
  autoHideSuccess = true,
}: ProgressIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setIsVisible(true);
    }

    // Auto-hide success message after 3 seconds
    if (status === "success" && autoHideSuccess) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Hide on error (error is handled by ErrorDisplay component)
    if (status === "error") {
      setIsVisible(false);
    }
  }, [status, autoHideSuccess, onComplete]);

  if (!isVisible || status === "idle" || status === "error") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {/* Upload Progress */}
        {status === "uploading" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {message || "Uploading file..."}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processing Status */}
        {status === "processing" && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {message || "Processing..."}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === "success" && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {message || "Operation completed successfully!"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage progress state
 */
export function useProgress() {
  const [status, setStatus] = useState<ProgressStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  const startUpload = (msg?: string) => {
    setStatus("uploading");
    setProgress(0);
    setMessage(msg);
  };

  const updateProgress = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const startProcessing = (msg?: string) => {
    setStatus("processing");
    setMessage(msg);
  };

  const setSuccess = (msg?: string) => {
    setStatus("success");
    setMessage(msg);
  };

  const setError = () => {
    setStatus("error");
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setMessage(undefined);
  };

  return {
    status,
    progress,
    message,
    startUpload,
    updateProgress,
    startProcessing,
    setSuccess,
    setError,
    reset,
  };
}
