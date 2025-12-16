import { useState, useEffect } from "react";
import { UploadedFile } from "./FileUpload";
import { getPagePreviews, splitFile, PagePreview } from "../services/api";
import * as pdfjsLib from "pdfjs-dist";
import PDFPreviewModal from "./PDFPreviewModal";

// Set up PDF.js worker using local file
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface SplitToolProps {
  file: UploadedFile | null;
  onSplitComplete?: (fileIds: string[], downloadUrls: string[]) => void;
  onError?: (error: string) => void;
}

export default function SplitTool({
  file,
  onSplitComplete,
  onError,
}: SplitToolProps) {
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [pageRanges, setPageRanges] = useState<string[]>([""]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<{
    outputFileIds: string[];
    downloadUrls: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);

  // Load previews when file changes
  useEffect(() => {
    if (file) {
      loadPreviews();
    } else {
      setPreviews([]);
    }
  }, [file]);

  const loadPreviews = async () => {
    if (!file) return;

    setIsLoadingPreviews(true);
    setError(null);

    try {
      const response = await getPagePreviews(file.fileId);
      setPreviews(response.previews);

      // Fetch and generate thumbnails
      await fetchAndGenerateThumbnails(file.fileId, response.previews.length);
    } catch (err: any) {
      const errorMsg = err.error?.message || "Failed to load page previews";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoadingPreviews(false);
    }
  };

  const fetchAndGenerateThumbnails = async (
    fileId: string,
    pageCount: number
  ) => {
    try {
      console.log("Fetching PDF for thumbnails...");
      // Fetch the PDF file from the server
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/download/${fileId}`);

      if (!response.ok) {
        console.error("Failed to fetch PDF:", response.status);
        throw new Error("Failed to fetch PDF file");
      }

      console.log("PDF fetched, generating thumbnails...");
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log("PDF loaded, page count:", pdf.numPages);

      const newThumbnails: { [key: number]: string } = {};

      // Generate thumbnails for each page
      for (
        let pageNum = 1;
        pageNum <= Math.min(pageCount, pdf.numPages);
        pageNum++
      ) {
        try {
          console.log(`Rendering page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.5 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            console.error(`No context for page ${pageNum}`);
            continue;
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          newThumbnails[pageNum] = canvas.toDataURL();
          console.log(`Page ${pageNum} rendered successfully`);

          // Update thumbnails progressively
          setThumbnails({ ...newThumbnails });
        } catch (pageError) {
          console.error(`Error rendering page ${pageNum}:`, pageError);
          newThumbnails[pageNum] = "";
        }
      }

      console.log(
        "All thumbnails generated:",
        Object.keys(newThumbnails).length
      );
    } catch (err) {
      console.error("Failed to generate thumbnails:", err);
      // Set empty thumbnails to stop infinite loading
      const emptyThumbnails: { [key: number]: string } = {};
      for (let i = 1; i <= pageCount; i++) {
        emptyThumbnails[i] = "";
      }
      setThumbnails(emptyThumbnails);
    }
  };

  const addPageRange = () => {
    setPageRanges([...pageRanges, ""]);
    setValidationErrors([...validationErrors, ""]);
  };

  const removePageRange = (index: number) => {
    const newRanges = pageRanges.filter((_, i) => i !== index);
    const newErrors = validationErrors.filter((_, i) => i !== index);
    setPageRanges(newRanges);
    setValidationErrors(newErrors);
  };

  const updatePageRange = (index: number, value: string) => {
    const newRanges = [...pageRanges];
    newRanges[index] = value;
    setPageRanges(newRanges);

    // Validate the range
    const newErrors = [...validationErrors];
    newErrors[index] = validatePageRange(value);
    setValidationErrors(newErrors);
  };

  const validatePageRange = (range: string): string => {
    if (!range.trim()) {
      return "Page range cannot be empty";
    }

    // Basic syntax validation
    const rangePattern = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
    if (!rangePattern.test(range.trim())) {
      return "Invalid syntax. Use format like: 1-5, 8, 10-12";
    }

    // Validate page numbers are within bounds
    const totalPages = previews.length;
    const parts = range.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (isNaN(start) || isNaN(end)) {
          return "Invalid page numbers";
        }
        if (start > end) {
          return `Invalid range: ${start}-${end}. Start must be <= end`;
        }
        if (start < 1 || end > totalPages) {
          return `Page numbers must be between 1 and ${totalPages}`;
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum)) {
          return "Invalid page number";
        }
        if (pageNum < 1 || pageNum > totalPages) {
          return `Page numbers must be between 1 and ${totalPages}`;
        }
      }
    }

    return "";
  };

  const handleSplit = async () => {
    if (!file) {
      const errorMsg = "No file selected";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Filter out empty ranges
    const nonEmptyRanges = pageRanges.filter((r) => r.trim() !== "");

    if (nonEmptyRanges.length === 0) {
      const errorMsg = "Please specify at least one page range";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Check for validation errors
    const hasErrors = validationErrors.some((err) => err !== "");
    if (hasErrors) {
      const errorMsg = "Please fix validation errors before splitting";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setIsSplitting(true);
    setSplitResult(null);

    try {
      const response = await splitFile(file.fileId, nonEmptyRanges);
      setSplitResult(response);
      // Automatically show preview for the first file
      setPreviewFileIndex(0);
      onSplitComplete?.(response.outputFileIds, response.downloadUrls);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred during PDF split";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleDownload = (downloadUrl: string) => {
    const fullUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:3000"
    }${downloadUrl}`;
    window.open(fullUrl, "_blank");
  };

  if (!file) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please upload a PDF file to split.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Split PDF File
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          File: <span className="font-medium">{file.filename}</span>
        </p>

        {isLoadingPreviews ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">
              Loading page previews...
            </p>
          </div>
        ) : (
          <>
            {/* Page Preview */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Page Preview ({previews.length} pages)
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {previews.map((preview) => (
                  <div
                    key={preview.pageNumber}
                    className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    {thumbnails[preview.pageNumber] &&
                    thumbnails[preview.pageNumber] !== "" ? (
                      <img
                        src={thumbnails[preview.pageNumber]}
                        alt={`Page ${preview.pageNumber}`}
                        className="w-full h-auto"
                      />
                    ) : thumbnails[preview.pageNumber] === "" ? (
                      <div className="aspect-[3/4] flex flex-col items-center justify-center bg-gray-50">
                        <svg
                          className="h-12 w-12 text-gray-400 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-xs text-gray-500">
                          Preview unavailable
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] flex flex-col items-center justify-center bg-gray-50">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white text-xs text-center py-1">
                      Page {preview.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page Range Inputs */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Specify Page Ranges
              </h4>
              <p className="text-xs text-gray-500">
                Use format like: 1-5, 8, 10-12 (each range will create a
                separate PDF)
              </p>

              {pageRanges.map((range, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={range}
                      onChange={(e) => updatePageRange(index, e.target.value)}
                      placeholder="e.g., 1-5, 8, 10-12"
                      className={`
                        w-full px-3 py-2 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${
                          validationErrors[index]
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }
                      `}
                    />
                    {validationErrors[index] && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors[index]}
                      </p>
                    )}
                  </div>
                  {pageRanges.length > 1 && (
                    <button
                      onClick={() => removePageRange(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addPageRange}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add another range
              </button>
            </div>

            {/* Split Button */}
            <div className="mt-6">
              <button
                onClick={handleSplit}
                disabled={isSplitting || pageRanges.every((r) => !r.trim())}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium text-white
                  transition-colors duration-200
                  ${
                    isSplitting || pageRanges.every((r) => !r.trim())
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
              >
                {isSplitting ? "Splitting PDF..." : "Split PDF"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
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

      {/* Success Display - Only show when preview is closed */}
      {splitResult && previewFileIndex === null && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-400 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <p className="text-sm text-green-800 font-medium mb-2">
                PDF split successfully! {splitResult.outputFileIds.length}{" "}
                file(s) created.
              </p>
              <div className="space-y-2">
                {splitResult.downloadUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <button
                      onClick={() => setPreviewFileIndex(index)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <span className="text-sm">Preview File {index + 1}</span>
                    </button>
                    <button
                      onClick={() => handleDownload(url)}
                      className="px-3 py-2 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                    >
                      <svg
                        className="h-5 w-5 text-gray-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {splitResult && previewFileIndex !== null && (
        <PDFPreviewModal
          isOpen={previewFileIndex !== null}
          onClose={() => setPreviewFileIndex(null)}
          onDownload={() => {
            handleDownload(splitResult.downloadUrls[previewFileIndex]);
            setPreviewFileIndex(null);
          }}
          fileId={splitResult.outputFileIds[previewFileIndex]}
          title={`Split PDF Preview - File ${previewFileIndex + 1}`}
        />
      )}
    </div>
  );
}
