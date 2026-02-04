import { useState, useEffect } from "react";

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

interface ErrorDisplayProps {
  error: ErrorInfo | null;
  onDismiss?: () => void;
  autoHideDuration?: number; // milliseconds, 0 means no auto-hide
}

/**
 * ErrorDisplay component shows error messages in a user-friendly format
 * with actionable suggestions and dismiss functionality
 */
export default function ErrorDisplay({
  error,
  onDismiss,
  autoHideDuration = 0,
}: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      // Auto-hide after duration if specified
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHideDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  // Get user-friendly message and suggestions based on error code
  const { friendlyMessage, suggestions } = getErrorDetails(error);

  return (
    <div className="fixed top-4 right-4 max-w-md z-50 animate-slide-in">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {friendlyMessage}
            </h3>
            {suggestions.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            {error.details && import.meta.env.DEV && (
              <div className="mt-2 text-xs text-red-600 font-mono">
                {typeof error.details === "string"
                  ? error.details
                  : JSON.stringify(error.details)}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get user-friendly error message and actionable suggestions based on error code
 */
function getErrorDetails(error: ErrorInfo): {
  friendlyMessage: string;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let friendlyMessage = error.message;

  switch (error.code) {
    case "NO_FILE":
      friendlyMessage = "No file was selected";
      suggestions.push("Please select a file to upload");
      break;

    case "INVALID_FILE_TYPE":
      friendlyMessage = "Invalid file type";
      suggestions.push("Please upload a valid PDF file");
      suggestions.push("Make sure the file has a .pdf extension");
      break;

    case "FILE_NOT_FOUND":
      friendlyMessage = "File not found";
      suggestions.push(
        "The file may have expired (files are kept for 60 minutes)",
      );
      suggestions.push("Please upload the file again");
      break;

    case "INVALID_INPUT":
      friendlyMessage = "Invalid input provided";
      suggestions.push("Please check your input and try again");
      break;

    case "MERGE_ERROR":
      friendlyMessage = "Failed to merge PDF files";
      suggestions.push("Make sure all files are valid PDFs");
      suggestions.push("Try uploading the files again");
      break;

    case "SPLIT_ERROR":
      friendlyMessage = "Failed to split PDF file";
      suggestions.push(
        "Check that your page ranges are valid (e.g., '1-5, 8, 10-12')",
      );
      suggestions.push(
        "Make sure page numbers don't exceed the document length",
      );
      break;

    case "COMPRESS_ERROR":
      friendlyMessage = "Failed to compress PDF file";
      suggestions.push("Try a different compression level");
      suggestions.push("Make sure the file is a valid PDF");
      break;

    case "CONVERT_ERROR":
      friendlyMessage = "Failed to convert file";
      suggestions.push("Check that the output format is supported");
      suggestions.push("Make sure the input file is valid");
      break;

    case "EDIT_ERROR":
      friendlyMessage = "Failed to edit PDF file";
      suggestions.push("Check that your edit operations are valid");
      suggestions.push("Make sure page indices are within range");
      break;

    case "UNSUPPORTED_FORMAT":
      friendlyMessage = "Unsupported file format";
      suggestions.push("Check the list of supported formats");
      suggestions.push("Try converting to a different format");
      break;

    case "NETWORK_ERROR":
      friendlyMessage = "Network connection failed";
      suggestions.push("Check your internet connection");
      suggestions.push("Try again in a few moments");
      break;

    case "UPLOAD_ERROR":
      friendlyMessage = "File upload failed";
      suggestions.push("Check your internet connection");
      suggestions.push("Make sure the file size is under 100MB");
      suggestions.push("Try uploading again");
      break;

    case "DOWNLOAD_ERROR":
      friendlyMessage = "File download failed";
      suggestions.push("Try downloading again");
      suggestions.push("The file may have expired");
      break;

    case "UNAUTHORIZED":
      friendlyMessage = "Incorrect password";
      suggestions.push("Please check the password and try again");
      break;

    case "INSUFFICIENT_STORAGE":
      friendlyMessage = "Server storage is full";
      suggestions.push("Please try again later");
      suggestions.push("Contact support if the problem persists");
      break;

    case "OUT_OF_MEMORY":
      friendlyMessage = "File is too large to process";
      suggestions.push("Try processing a smaller file");
      suggestions.push("Split large files into smaller parts");
      break;

    default:
      friendlyMessage = error.message || "An unexpected error occurred";
      suggestions.push("Please try again");
      suggestions.push("Contact support if the problem persists");
  }

  return { friendlyMessage, suggestions };
}
