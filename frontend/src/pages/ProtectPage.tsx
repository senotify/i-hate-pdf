import { useState } from "react";
import ToolLayout from "../components/ToolLayout";
import FileUpload, { UploadedFile } from "../components/FileUpload";
import ProtectTool from "../components/ProtectTool";

export default function ProtectPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFile(file);
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Secure your PDF with password protection"
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
            <ProtectTool file={uploadedFile} />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
