import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { DndMultiBackend, DndBackendOptions } from "../utils/dndBackend";
import { UploadedFile } from "./FileUpload";
import { mergeFiles } from "../services/api";

interface MergeToolProps {
  files: UploadedFile[];
  onMergeComplete?: (fileId: string, downloadUrl: string) => void;
  onError?: (error: string) => void;
}

interface DraggableFileItemProps {
  file: UploadedFile;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
}

const ItemType = "FILE";

function DraggableFileItem({ file, index, moveFile }: DraggableFileItemProps) {
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
        moveFile(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        p-4 bg-white border rounded-lg cursor-move
        transition-opacity duration-200
        ${isDragging ? "opacity-50" : "opacity-100"}
        hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
          <div>
            <p className="font-medium text-gray-900">{file.filename}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-400">#{index + 1}</div>
      </div>
    </div>
  );
}

export default function MergeTool({
  files,
  onMergeComplete,
  onError,
}: MergeToolProps) {
  const [orderedFiles, setOrderedFiles] = useState<UploadedFile[]>(files);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<{
    outputFileId: string;
    downloadUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moveFile = (dragIndex: number, hoverIndex: number) => {
    const newFiles = [...orderedFiles];
    const [draggedFile] = newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, draggedFile);
    setOrderedFiles(newFiles);
  };

  const handleMerge = async () => {
    if (orderedFiles.length < 2) {
      const errorMsg = "Please upload at least 2 PDF files to merge";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setIsMerging(true);
    setMergeResult(null);

    try {
      const fileIds = orderedFiles.map((f) => f.fileId);
      const response = await mergeFiles(fileIds);

      setMergeResult(response);
      onMergeComplete?.(response.outputFileId, response.downloadUrl);
    } catch (err: any) {
      const errorMsg =
        err.error?.message || "An error occurred during PDF merge";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (mergeResult) {
      const downloadUrl = `${
        import.meta.env.VITE_API_URL || "http://localhost:3000"
      }${mergeResult.downloadUrl}`;
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <DndProvider backend={DndMultiBackend} options={DndBackendOptions}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Merge PDF Files
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop to reorder files. Files will be merged in the order
            shown below.
          </p>

          {orderedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet. Please upload PDF files above.
            </div>
          ) : (
            <div className="space-y-2">
              {orderedFiles.map((file, index) => (
                <DraggableFileItem
                  key={file.fileId}
                  file={file}
                  index={index}
                  moveFile={moveFile}
                />
              ))}
            </div>
          )}
        </div>

        {orderedFiles.length >= 2 && (
          <div>
            <button
              onClick={handleMerge}
              disabled={isMerging}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                transition-colors duration-200
                ${
                  isMerging
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >
              {isMerging ? "Merging PDFs..." : "Merge PDFs"}
            </button>
          </div>
        )}

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

        {mergeResult && (
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
                  PDFs merged successfully!
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
