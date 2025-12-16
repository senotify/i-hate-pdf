import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadFile, isValidPDFFile, UploadError } from "../services/api";
import ProgressIndicator, { useProgress } from "./ProgressIndicator";
import ErrorDisplay, { ErrorInfo } from "./ErrorDisplay";

export interface UploadedFile {
  fileId: string;
  filename: string;
  size: number;
}

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
  multiple = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progress = useProgress();

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setError(null);
    progress.reset();

    // If not multiple, only take the first file
    const filesToProcess = multiple ? files : [files[0]];

    for (const file of filesToProcess) {
      // Validate file type on client side
      if (!isValidPDFFile(file)) {
        const errorInfo: ErrorInfo = {
          code: "INVALID_FILE_TYPE",
          message: `"${file.name}" is not a valid PDF file`,
        };
        setError(errorInfo);
        onUploadError?.(errorInfo.message);
        continue;
      }

      // Upload file
      try {
        progress.startUpload(`Uploading ${file.name}...`);

        const response = await uploadFile(file, (progressValue) => {
          progress.updateProgress(progressValue);
        });

        progress.setSuccess("File uploaded successfully!");
        onUploadComplete?.(response);
      } catch (err) {
        progress.setError();

        const uploadError = err as UploadError;
        const errorInfo: ErrorInfo = {
          code: uploadError.error?.code || "UPLOAD_ERROR",
          message:
            uploadError.error?.message || "An error occurred during upload",
          details: uploadError.error?.details,
        };
        setError(errorInfo);
        onUploadError?.(errorInfo.message);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${
            progress.status === "uploading"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={progress.status === "idle" ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={progress.status !== "idle"}
        />

        {progress.status === "uploading" ? (
          <div className="space-y-4">
            <div className="text-gray-600">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{progress.progress}%</div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-gray-600">
              <span className="font-semibold text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{" "}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">PDF files only</p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        status={progress.status}
        progress={progress.progress}
        message={progress.message}
        onComplete={() => progress.reset()}
      />

      {/* Error Display */}
      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
    </div>
  );
}
