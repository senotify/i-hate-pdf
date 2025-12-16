import { useState } from "react";
import { getApiBaseUrl } from "../utils/apiUrl";
import { UploadedFile } from "./FileUpload";
import { compressFile } from "../services/api";
import PDFPreviewModal from "./PDFPreviewModal";

interface CompressToolProps {
  file: UploadedFile;
  onCompressComplete?: (
    fileId: string,
    downloadUrl: string,
    originalSize: number,
    compressedSize: number,
    reductionPercentage: number
  ) => void;
  onError?: (error: string) => void;
}

type CompressionLevel = "low" | "medium" | "high";

export default function CompressTool({
  file,
  onCompressComplete,
  onError,
}: CompressToolProps) {
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("medium");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressResult, setCompressResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCompress = async () => {
    setError(null);
    setIsCompressing(true);
    setCompressResult(null);

    try {
      const response = await compressFile(file.fileId, compressionLevel);

      setCompressResult(response);
      setShowPreview(true);
      onCompressComplete?.(
        response.outputFileId,
        response.downloadUrl,
        response.originalSize,
        response.compressedSize,
        response.reductionPercentage
      );
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred during PDF compression";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (compressResult) {
      const downloadUrl = `${
        getApiBaseUrl()
      }${compressResult.downloadUrl}`;
      window.open(downloadUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Compress PDF
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Reduce the file size of your PDF document.
        </p>

        {/* File Info */}
        <div className="p-4 bg-gray-50 border rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.filename}</p>
              <p className="text-sm text-gray-500">
                Original size: {formatFileSize(file.size)}
              </p>
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
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Compression Level Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Compression Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setCompressionLevel("low")}
              disabled={isCompressing}
              className={`
                p-4 border-2 rounded-lg text-center transition-all duration-200
                ${
                  compressionLevel === "low"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="font-semibold text-gray-900">Low</div>
              <div className="text-xs text-gray-500 mt-1">
                Better quality, larger file
              </div>
            </button>
            <button
              onClick={() => setCompressionLevel("medium")}
              disabled={isCompressing}
              className={`
                p-4 border-2 rounded-lg text-center transition-all duration-200
                ${
                  compressionLevel === "medium"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="font-semibold text-gray-900">Medium</div>
              <div className="text-xs text-gray-500 mt-1">
                Balanced quality and size
              </div>
            </button>
            <button
              onClick={() => setCompressionLevel("high")}
              disabled={isCompressing}
              className={`
                p-4 border-2 rounded-lg text-center transition-all duration-200
                ${
                  compressionLevel === "high"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="font-semibold text-gray-900">High</div>
              <div className="text-xs text-gray-500 mt-1">
                Maximum compression
              </div>
            </button>
          </div>
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={isCompressing}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${
              isCompressing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {isCompressing ? "Compressing PDF..." : "Compress PDF"}
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

      {/* Success Message with Size Reduction - Only show when preview is closed */}
      {compressResult && !showPreview && (
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
                PDF compressed successfully!
              </p>
            </div>

            {/* Size Reduction Info */}
            <div className="bg-white rounded p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original size:</span>
                <span className="font-medium text-gray-900">
                  {formatFileSize(compressResult.originalSize)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Compressed size:</span>
                <span className="font-medium text-gray-900">
                  {formatFileSize(compressResult.compressedSize)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Size reduction:</span>
                <span className="font-bold text-green-600">
                  {compressResult.reductionPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Preview & Download
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {compressResult && (
        <PDFPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          fileId={compressResult.outputFileId}
          title="Compressed PDF Preview"
        />
      )}
    </div>
  );
}
