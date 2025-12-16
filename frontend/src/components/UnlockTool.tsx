import { useState } from "react";
import { UploadedFile } from "./FileUpload";
import { unlockFile } from "../services/api";

interface UnlockToolProps {
  file: UploadedFile;
  onComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

export default function UnlockTool({
  file,
  onComplete,
  onError,
}: UnlockToolProps) {
  const [password, setPassword] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    // Validate password
    if (!password) {
      setError("Please enter a password");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await unlockFile(file.fileId, password);

      setResult(response);
      onComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred while unlocking the PDF";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }${result.downloadUrl}`;
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Unlock PDF</h3>
        <p className="text-sm text-gray-600 mb-4">
          Remove password protection from your PDF document.
        </p>

        {/* File Info */}
        <div className="p-4 bg-gray-50 border rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.filename}</p>
            </div>
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isProcessing) {
                handleUnlock();
              }
            }}
            disabled={isProcessing}
            placeholder="Enter password to unlock"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-xs text-gray-500">
            Enter the password that was used to protect this PDF.
          </p>
        </div>

        {/* Unlock Button */}
        <button
          onClick={handleUnlock}
          disabled={isProcessing}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {isProcessing ? "Unlocking PDF..." : "Unlock PDF"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              {error.includes("password") && (
                <p className="mt-1 text-xs text-red-700">
                  Please check your password and try again.
                </p>
              )}
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
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
      )}

      {/* Success Message */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-green-800 font-medium">
                PDF unlocked successfully!
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Download Unlocked PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
