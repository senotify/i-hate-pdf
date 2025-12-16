import { useState } from "react";
import ToolLayout from "../components/ToolLayout";
import FileUpload, { UploadedFile } from "../components/FileUpload";
import MergeTool from "../components/MergeTool";

export default function MergePage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  return (
    <ToolLayout
      title="Merge PDFs"
      description="Combine multiple PDF files into a single document"
    >
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload PDF Files
          </h2>
          <FileUpload onUploadComplete={handleUploadComplete} multiple={true} />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <MergeTool files={uploadedFiles} />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
