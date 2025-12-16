import { useState } from "react";
import ToolLayout from "../components/ToolLayout";
import FileUpload, { UploadedFile } from "../components/FileUpload";
import ConvertTool from "../components/ConvertTool";

export default function ConvertPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  return (
    <ToolLayout
      title="Convert PDF"
      description="Convert PDFs to other formats or vice versa"
    >
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload File
          </h2>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            multiple={false}
          />
        </div>

        {uploadedFile && (
          <div className="bg-white shadow rounded-lg p-6">
            <ConvertTool file={uploadedFile} />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
