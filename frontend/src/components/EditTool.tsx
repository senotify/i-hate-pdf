import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../utils/apiUrl";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { DndMultiBackend, DndBackendOptions } from "../utils/dndBackend";
import { UploadedFile } from "./FileUpload";
import {
  getPagePreviews,
  editFile,
  PagePreview,
  EditOperation,
} from "../services/api";

interface EditToolProps {
  file: UploadedFile | null;
  onEditComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

interface PageThumbnailProps {
  preview: PagePreview;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  movePage: (dragIndex: number, hoverIndex: number) => void;
}

const ItemType = "PAGE";

function PageThumbnail({
  preview,
  index,
  isSelected,
  onToggleSelect,
  movePage,
}: PageThumbnailProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        movePage(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      onClick={() => onToggleSelect(index)}
      className={`
        relative aspect-[3/4] border-2 rounded cursor-pointer
        transition-all duration-200
        ${isDragging ? "opacity-50" : "opacity-100"}
        ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }
      `}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          ✓
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-50 text-white text-xs text-center py-1">
        Page {preview.pageNumber}
      </div>
    </div>
  );
}

export default function EditTool({
  file,
  onEditComplete,
  onError,
}: EditToolProps) {
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());

  // Load previews when file changes
  useEffect(() => {
    if (file) {
      loadPreviews();
    } else {
      setPreviews([]);
      setSelectedPages(new Set());
      setHasChanges(false);
      setOriginalOrder([]);
      setRotations(new Map());
    }
  }, [file]);

  const loadPreviews = async () => {
    if (!file) return;

    setIsLoadingPreviews(true);
    setError(null);

    try {
      const response = await getPagePreviews(file.fileId);
      setPreviews(response.previews);
      // Store original order (0-indexed)
      setOriginalOrder(response.previews.map((_, idx) => idx));
    } catch (err: any) {
      const errorMsg = err.error?.message || "Failed to load page previews";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoadingPreviews(false);
    }
  };

  const togglePageSelection = (index: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPages(newSelected);
  };

  const selectAllPages = () => {
    const allIndices = previews.map((_, index) => index);
    setSelectedPages(new Set(allIndices));
  };

  const deselectAllPages = () => {
    setSelectedPages(new Set());
  };

  const movePage = (dragIndex: number, hoverIndex: number) => {
    const newPreviews = [...previews];
    const [draggedPreview] = newPreviews.splice(dragIndex, 1);
    newPreviews.splice(hoverIndex, 0, draggedPreview);

    setPreviews(newPreviews);
    setHasChanges(true);
  };

  const handleRotate = (rotation: number) => {
    if (selectedPages.size === 0) {
      const errorMsg = "Please select at least one page to rotate";
      setError(errorMsg);
      return;
    }

    // Update rotations for selected pages
    const newRotations = new Map(rotations);
    selectedPages.forEach((pageIndex) => {
      const currentRotation = newRotations.get(pageIndex) || 0;
      newRotations.set(pageIndex, currentRotation + rotation);
    });

    setRotations(newRotations);
    setHasChanges(true);
    setError(null);
  };

  const handleDelete = () => {
    if (selectedPages.size === 0) {
      const errorMsg = "Please select at least one page to delete";
      setError(errorMsg);
      return;
    }

    if (selectedPages.size === previews.length) {
      const errorMsg = "Cannot delete all pages from the document";
      setError(errorMsg);
      return;
    }

    // Remove selected pages from previews
    const newPreviews = previews.filter(
      (_, index) => !selectedPages.has(index)
    );

    setPreviews(newPreviews);
    setSelectedPages(new Set());
    setHasChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!file) {
      const errorMsg = "No file selected";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (!hasChanges) {
      const errorMsg = "No changes to save";
      setError(errorMsg);
      return;
    }

    setError(null);
    setIsEditing(true);
    setEditResult(null);

    try {
      // Build operations array based on changes
      const operations: EditOperation[] = [];

      // 1. Handle rotations first (on original indices)
      if (rotations.size > 0) {
        const rotateIndices: number[] = [];
        let commonRotation = 0;

        rotations.forEach((rotation, pageIndex) => {
          if (rotation !== 0) {
            rotateIndices.push(previews[pageIndex].pageNumber - 1);
            commonRotation = rotation; // Assuming all selected pages have same rotation
          }
        });

        if (rotateIndices.length > 0) {
          operations.push({
            type: "rotate",
            params: { pageIndices: rotateIndices, rotation: commonRotation },
          });
        }
      }

      // 2. Handle deletions
      if (previews.length < originalOrder.length) {
        const remainingOriginalIndices = new Set(
          previews.map((p) => p.pageNumber - 1)
        );
        const deletedIndices = originalOrder.filter(
          (idx) => !remainingOriginalIndices.has(idx)
        );

        if (deletedIndices.length > 0) {
          operations.push({
            type: "delete",
            params: { pageIndices: deletedIndices },
          });
        }
      }

      // 3. Handle reordering (after deletions)
      const newOrder = previews.map((p) => p.pageNumber - 1);
      const expectedOrder = Array.from(
        { length: newOrder.length },
        (_, i) => i
      );

      if (!newOrder.every((val, idx) => val === expectedOrder[idx])) {
        operations.push({
          type: "reorder",
          params: { newOrder },
        });
      }

      // If no operations, nothing to do
      if (operations.length === 0) {
        const errorMsg = "No operations to apply";
        setError(errorMsg);
        setIsEditing(false);
        return;
      }

      const response = await editFile(file.fileId, operations);
      setEditResult(response);
      setHasChanges(false);
      onEditComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred during PDF edit";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = () => {
    if (editResult) {
      const downloadUrl = `${
        getApiBaseUrl()
      }${editResult.downloadUrl}`;
      window.open(downloadUrl, "_blank");
    }
  };

  if (!file) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please upload a PDF file to edit.
      </div>
    );
  }

  return (
    <DndProvider backend={DndMultiBackend} options={DndBackendOptions}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Edit PDF File
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
              {/* Control Buttons */}
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={selectAllPages}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllPages}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Deselect All
                  </button>
                  <div className="flex-1"></div>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    {selectedPages.size} page(s) selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRotate(90)}
                    disabled={selectedPages.size === 0}
                    className={`
                      px-4 py-2 text-sm rounded-lg transition-colors
                      ${
                        selectedPages.size === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }
                    `}
                  >
                    ↻ Rotate 90° CW
                  </button>
                  <button
                    onClick={() => handleRotate(-90)}
                    disabled={selectedPages.size === 0}
                    className={`
                      px-4 py-2 text-sm rounded-lg transition-colors
                      ${
                        selectedPages.size === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }
                    `}
                  >
                    ↺ Rotate 90° CCW
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={selectedPages.size === 0}
                    className={`
                      px-4 py-2 text-sm rounded-lg transition-colors
                      ${
                        selectedPages.size === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }
                    `}
                  >
                    🗑 Delete Selected
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Tip: Drag and drop pages to reorder them
                </p>
              </div>

              {/* Page Thumbnails */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Pages ({previews.length})
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {previews.map((preview, index) => (
                    <PageThumbnail
                      key={`${preview.pageNumber}-${index}`}
                      preview={preview}
                      index={index}
                      isSelected={selectedPages.has(index)}
                      onToggleSelect={togglePageSelection}
                      movePage={movePage}
                    />
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  disabled={isEditing || !hasChanges}
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium text-white
                    transition-colors duration-200
                    ${
                      isEditing || !hasChanges
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  `}
                >
                  {isEditing
                    ? "Saving Changes..."
                    : hasChanges
                    ? "Save Changes"
                    : "No Changes to Save"}
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

        {/* Success Display */}
        {editResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
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
                <p className="ml-3 text-sm text-green-800">
                  PDF edited successfully!
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
