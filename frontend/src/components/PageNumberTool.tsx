import { useState } from "react";
import { getApiBaseUrl } from "../utils/apiUrl";
import { UploadedFile } from "./FileUpload";
import { addPageNumbers, PageNumberOptions } from "../services/api";
import PDFPreviewModal from "./PDFPreviewModal";

interface PageNumberToolProps {
  file: UploadedFile;
  onComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

type Position =
  | "top-center"
  | "bottom-center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export default function PageNumberTool({
  file,
  onComplete,
  onError,
}: PageNumberToolProps) {
  const [format, setFormat] = useState<string>("Page {n} of {total}");
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddPageNumbers = async () => {
    setError(null);
    setIsProcessing(true);
    setResult(null);

    try {
      const options: PageNumberOptions = {
        format,
        position,
        startNumber,
        fontSize,
        fontFamily: "Helvetica",
      };

      const response = await addPageNumbers(file.fileId, options);

      setResult(response);
      setShowPreview(true);
      onComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred while adding page numbers";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const downloadUrl = `${
        getApiBaseUrl()
      }${result.downloadUrl}`;
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Add Page Numbers
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add sequential page numbers to your PDF document.
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
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Format Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <input
            type="text"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={isProcessing}
            placeholder="Page {n} of {total}"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {"{n}"} for page number and {"{total}"} for total pages
          </p>
        </div>

        {/* Position Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPosition("top-left")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "top-left"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Top Left
            </button>
            <button
              onClick={() => setPosition("top-center")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "top-center"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Top Center
            </button>
            <button
              onClick={() => setPosition("top-right")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "top-right"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Top Right
            </button>
            <button
              onClick={() => setPosition("bottom-left")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "bottom-left"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Bottom Left
            </button>
            <button
              onClick={() => setPosition("bottom-center")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "bottom-center"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Bottom Center
            </button>
            <button
              onClick={() => setPosition("bottom-right")}
              disabled={isProcessing}
              className={`
                p-3 border-2 rounded-lg text-sm transition-all duration-200
                ${
                  position === "bottom-right"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              Bottom Right
            </button>
          </div>
        </div>

        {/* Starting Number Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Starting Number
          </label>
          <input
            type="number"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
            disabled={isProcessing}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Font Size Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size
          </label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
            disabled={isProcessing}
            min="6"
            max="72"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Add Page Numbers Button */}
        <button
          onClick={handleAddPageNumbers}
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
          {isProcessing ? "Adding Page Numbers..." : "Add Page Numbers"}
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

      {/* Success Message - Only show when preview is closed */}
      {result && !showPreview && (
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
                Page numbers added successfully!
              </p>
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
      {result && (
        <PDFPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          fileId={result.outputFileId}
          title="PDF with Page Numbers Preview"
        />
      )}
    </div>
  );
}
