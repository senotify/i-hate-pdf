import { useState } from "react";
import ToolLayout from "../components/ToolLayout";
import FileUpload, { UploadedFile } from "../components/FileUpload";
import CompressTool from "../components/CompressTool";

export default function CompressPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size for easier sharing"
    >
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload PDF File
          </h2>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            multiple={false}
          />
        </div>

        {uploadedFile && (
          <div className="bg-white shadow rounded-lg p-6">
            <CompressTool file={uploadedFile} />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
