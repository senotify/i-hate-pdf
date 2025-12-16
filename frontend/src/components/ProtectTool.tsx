import { useState } from "react";
import { UploadedFile } from "./FileUpload";
import { protectFile, Permissions } from "../services/api";

interface ProtectToolProps {
  file: UploadedFile;
  onComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

export default function ProtectTool({
  file,
  onComplete,
  onError,
}: ProtectToolProps) {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>({
    printing: true,
    modifying: true,
    copying: true,
    annotating: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProtect = async () => {
    // Validate password
    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await protectFile(file.fileId, password, permissions);

      setResult(response);
      onComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred while protecting the PDF";
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

  const togglePermission = (key: keyof Permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Protect PDF
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add password protection and set permissions for your PDF document.
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isProcessing}
            placeholder="Enter password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Confirm Password Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isProcessing}
            placeholder="Confirm password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.printing}
                onChange={() => togglePermission("printing")}
                disabled={isProcessing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm text-gray-700">Allow printing</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.modifying}
                onChange={() => togglePermission("modifying")}
                disabled={isProcessing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm text-gray-700">
                Allow modifying content
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.copying}
                onChange={() => togglePermission("copying")}
                disabled={isProcessing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm text-gray-700">
                Allow copying text and images
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={permissions.annotating}
                onChange={() => togglePermission("annotating")}
                disabled={isProcessing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <span className="ml-3 text-sm text-gray-700">
                Allow adding annotations
              </span>
            </label>
          </div>
        </div>

        {/* Protect Button */}
        <button
          onClick={handleProtect}
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
          {isProcessing ? "Protecting PDF..." : "Protect PDF"}
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
                PDF protected successfully!
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Download Protected PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
