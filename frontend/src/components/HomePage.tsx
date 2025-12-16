import { Link } from "react-router-dom";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

const tools: Tool[] = [
  {
    id: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDF files into a single document",
    icon: "📑",
    path: "/merge",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Divide a PDF into separate documents by page ranges",
    icon: "✂️",
    path: "/split",
  },
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce PDF file size for easier sharing",
    icon: "🗜️",
    path: "/compress",
  },
  {
    id: "convert",
    name: "Convert PDF",
    description: "Convert PDFs to other formats or vice versa",
    icon: "🔄",
    path: "/convert",
  },
  {
    id: "edit",
    name: "Edit PDF",
    description: "Rotate, delete, and reorder pages in your PDF",
    icon: "✏️",
    path: "/edit",
  },
  {
    id: "page-numbers",
    name: "Add Page Numbers",
    description: "Add sequential page numbers to your PDF",
    icon: "🔢",
    path: "/page-numbers",
  },
  {
    id: "watermark",
    name: "Add Watermark",
    description: "Overlay text watermarks on your PDF pages",
    icon: "💧",
    path: "/watermark",
  },
  {
    id: "protect",
    name: "Protect PDF",
    description: "Secure your PDF with password protection",
    icon: "🔒",
    path: "/protect",
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove password protection from PDFs",
    icon: "🔓",
    path: "/unlock",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Toolkit</h1>
          <p className="mt-2 text-sm text-gray-600">
            Professional PDF tools for all your document needs
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Choose a Tool
          </h2>
          <p className="text-gray-600">
            Select a tool below to get started with your PDF operations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 hover:border-blue-500"
            >
              <div className="flex items-start space-x-4">
                <div className="text-4xl flex-shrink-0">{tool.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Privacy First
          </h3>
          <p className="text-sm text-blue-800">
            Your files are automatically deleted after 60 minutes. We prioritize
            your privacy and security.
          </p>
        </div>
      </main>
    </div>
  );
}
