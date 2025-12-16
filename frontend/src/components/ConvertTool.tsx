import { useState, useEffect } from "react";
import { UploadedFile } from "./FileUpload";
import { convertFile } from "../services/api";
import PDFPreviewModal from "./PDFPreviewModal";

interface ConvertToolProps {
  file: UploadedFile;
  onConvertComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

// Supported formats based on file type
const PDF_OUTPUT_FORMATS = [
  {
    value: "png",
    label: "PNG Image",
    description: "Portable Network Graphics",
  },
  {
    value: "jpeg",
    label: "JPEG Image",
    description: "Joint Photographic Experts Group",
  },
];

const IMAGE_OUTPUT_FORMATS = [
  {
    value: "pdf",
    label: "PDF Document",
    description: "Portable Document Format",
  },
];

export default function ConvertTool({
  file,
  onConvertComplete,
  onError,
}: ConvertToolProps) {
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableFormats, setAvailableFormats] = useState<
    Array<{ value: string; label: string; description: string }>
  >([]);

  // Detect file type and set available formats
  useEffect(() => {
    const fileExtension = file.filename.toLowerCase().split(".").pop();
    const isPDF =
      fileExtension === "pdf" || file.filename.toLowerCase().endsWith(".pdf");
    const isImage = ["png", "jpg", "jpeg"].includes(fileExtension || "");

    if (isPDF) {
      setAvailableFormats(PDF_OUTPUT_FORMATS);
      setOutputFormat(PDF_OUTPUT_FORMATS[0].value);
    } else if (isImage) {
      setAvailableFormats(IMAGE_OUTPUT_FORMATS);
      setOutputFormat(IMAGE_OUTPUT_FORMATS[0].value);
    } else {
      setAvailableFormats([]);
      setError(
        "Unsupported file type. Please upload a PDF or image file (PNG, JPEG)."
      );
    }
  }, [file]);

  const handleConvert = async () => {
    if (!outputFormat) {
      setError("Please select an output format");
      return;
    }

    setError(null);
    setIsConverting(true);
    setConvertResult(null);

    try {
      const response = await convertFile(file.fileId, outputFormat);

      setConvertResult(response);
      onConvertComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred during file conversion";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (convertResult) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }${convertResult.downloadUrl}`;
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
          Convert File
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Convert your file to a different format.
        </p>

        {/* File Info */}
        <div className="p-4 bg-gray-50 border rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.filename}</p>
              <p className="text-sm text-gray-500">
                Size: {formatFileSize(file.size)}
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

        {/* Format Selector */}
        {availableFormats.length > 0 ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Output Format
            </label>
            <div className="space-y-3">
              {availableFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setOutputFormat(format.value)}
                  disabled={isConverting}
                  className={`
                    w-full p-4 border-2 rounded-lg text-left transition-all duration-200
                    ${
                      outputFormat === format.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                    ${isConverting ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format.description}
                      </div>
                    </div>
                    {outputFormat === format.value && (
                      <svg
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Convert Button */}
        {availableFormats.length > 0 && (
          <button
            onClick={handleConvert}
            disabled={isConverting || !outputFormat}
            className={`
              w-full py-3 px-4 rounded-lg font-medium text-white
              transition-colors duration-200
              ${
                isConverting || !outputFormat
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isConverting ? "Converting..." : "Convert File"}
          </button>
        )}
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
      {convertResult && (
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
                File converted successfully!
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Download Converted File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
