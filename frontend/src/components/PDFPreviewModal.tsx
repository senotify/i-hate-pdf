import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { getApiBaseUrl } from "../utils/apiUrl";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  fileId: string;
  title?: string;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  onDownload,
  fileId,
  title = "Preview PDF",
}: PDFPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImages, setPageImages] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && fileId) {
      loadPDF();
    }
  }, [isOpen, fileId]);

  const loadPDF = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch the PDF file
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/download/${fileId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setTotalPages(pdf.numPages);

      // Render all pages
      const images: { [key: number]: string } = {};
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        images[pageNum] = canvas.toDataURL();
      }

      setPageImages(images);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load PDF preview:", err);
      setError("Failed to load PDF preview");
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDownloadAndClose = () => {
    onDownload();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 w-full">
                <svg
                  className="h-12 w-12 text-red-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {/* Left Sidebar - Page Thumbnails */}
                <div className="w-48 border-r bg-gray-50 overflow-y-auto p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Pages ({totalPages})
                  </p>
                  <div className="space-y-3">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            const element = document.getElementById(
                              `page-${pageNum}`
                            );
                            element?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                            setCurrentPage(pageNum);
                          }}
                          className={`
                            relative w-full aspect-[3/4] border-2 rounded overflow-hidden
                            transition-all hover:scale-105
                            ${
                              pageNum === currentPage
                                ? "border-blue-600 ring-2 ring-blue-200"
                                : "border-gray-300 hover:border-blue-400"
                            }
                          `}
                        >
                          {pageImages[pageNum] ? (
                            <img
                              src={pageImages[pageNum]}
                              alt={`Page ${pageNum}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1">
                            Page {pageNum}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Right Side - Scrollable Full Document */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <div
                          key={pageNum}
                          id={`page-${pageNum}`}
                          className="bg-white rounded-lg shadow-lg p-4"
                        >
                          <div className="text-sm text-gray-600 mb-2 font-medium">
                            Page {pageNum} of {totalPages}
                          </div>
                          {pageImages[pageNum] ? (
                            <img
                              src={pageImages[pageNum]}
                              alt={`Page ${pageNum}`}
                              className="w-full h-auto"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-96 bg-gray-50">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadAndClose}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
