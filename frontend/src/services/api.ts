import axios, { AxiosProgressEvent } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface UploadResponse {
  fileId: string;
  filename: string;
  size: number;
}

export interface UploadError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Upload a file to the backend
 * @param file - File to upload
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Upload response with file metadata
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

/**
 * Validate if a file is a PDF based on extension and MIME type
 * @param file - File to validate
 * @returns true if file appears to be a PDF
 */
export function isValidPDFFile(file: File): boolean {
  // Check file extension
  const hasValidExtension = file.name.toLowerCase().endsWith(".pdf");

  // Check MIME type
  const hasValidMimeType = file.type === "application/pdf";

  return hasValidExtension && hasValidMimeType;
}

export interface MergeResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Merge multiple PDF files into a single PDF
 * @param fileIds - Array of file IDs to merge
 * @returns Merge response with output file ID and download URL
 */
export async function mergeFiles(fileIds: string[]): Promise<MergeResponse> {
  try {
    const response = await axios.post<MergeResponse>(`${API_BASE_URL}/merge`, {
      fileIds,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface PagePreview {
  pageNumber: number;
  thumbnailDataUrl?: string;
}

export interface PreviewResponse {
  fileId: string;
  pageCount: number;
  previews: PagePreview[];
}

/**
 * Get page previews for a PDF file
 * @param fileId - File ID to get previews for
 * @returns Preview response with page information
 */
export async function getPagePreviews(
  fileId: string
): Promise<PreviewResponse> {
  try {
    const response = await axios.get<PreviewResponse>(
      `${API_BASE_URL}/preview/${fileId}`
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface SplitResponse {
  outputFileIds: string[];
  downloadUrls: string[];
}

/**
 * Split a PDF file into multiple PDFs based on page ranges
 * @param fileId - File ID to split
 * @param ranges - Array of page range strings (e.g., ["1-5", "8", "10-12"])
 * @returns Split response with output file IDs and download URLs
 */
export async function splitFile(
  fileId: string,
  ranges: string[]
): Promise<SplitResponse> {
  try {
    const response = await axios.post<SplitResponse>(`${API_BASE_URL}/split`, {
      fileId,
      ranges,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface CompressResponse {
  outputFileId: string;
  downloadUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

/**
 * Compress a PDF file
 * @param fileId - File ID to compress
 * @param level - Compression level: "low", "medium", or "high"
 * @returns Compress response with output file ID, download URL, and size metrics
 */
export async function compressFile(
  fileId: string,
  level: "low" | "medium" | "high"
): Promise<CompressResponse> {
  try {
    const response = await axios.post<CompressResponse>(
      `${API_BASE_URL}/compress`,
      {
        fileId,
        level,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface ConvertResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Convert a file to another format
 * @param fileId - File ID to convert
 * @param outputFormat - Target format (e.g., "png", "jpeg", "pdf")
 * @returns Convert response with output file ID and download URL
 */
export async function convertFile(
  fileId: string,
  outputFormat: string
): Promise<ConvertResponse> {
  try {
    const response = await axios.post<ConvertResponse>(
      `${API_BASE_URL}/convert`,
      {
        fileId,
        outputFormat,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface EditOperation {
  type: "rotate" | "delete" | "reorder";
  params: Record<string, any>;
}

export interface EditResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Edit a PDF file by applying operations (rotate, delete, reorder)
 * @param fileId - File ID to edit
 * @param operations - Array of operations to apply
 * @returns Edit response with output file ID and download URL
 */
export async function editFile(
  fileId: string,
  operations: EditOperation[]
): Promise<EditResponse> {
  try {
    const response = await axios.post<EditResponse>(`${API_BASE_URL}/edit`, {
      fileId,
      operations,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface PageNumberOptions {
  format: string;
  position:
    | "top-center"
    | "bottom-center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  startNumber: number;
  fontSize: number;
  fontFamily: string;
}

export interface PageNumberResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Add page numbers to a PDF file
 * @param fileId - File ID to add page numbers to
 * @param options - Page number options
 * @returns Response with output file ID and download URL
 */
export async function addPageNumbers(
  fileId: string,
  options: PageNumberOptions
): Promise<PageNumberResponse> {
  try {
    const response = await axios.post<PageNumberResponse>(
      `${API_BASE_URL}/page-numbers`,
      {
        fileId,
        options,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  position:
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  color: string;
}

export interface WatermarkResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Add a watermark to a PDF file
 * @param fileId - File ID to add watermark to
 * @param options - Watermark options
 * @returns Response with output file ID and download URL
 */
export async function addWatermark(
  fileId: string,
  options: WatermarkOptions
): Promise<WatermarkResponse> {
  try {
    const response = await axios.post<WatermarkResponse>(
      `${API_BASE_URL}/watermark`,
      {
        fileId,
        options,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface Permissions {
  printing: boolean;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
}

export interface ProtectResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Protect a PDF file with password and permissions
 * @param fileId - File ID to protect
 * @param password - Password to encrypt the PDF
 * @param permissions - Optional permissions settings
 * @returns Response with output file ID and download URL
 */
export async function protectFile(
  fileId: string,
  password: string,
  permissions?: Permissions
): Promise<ProtectResponse> {
  try {
    const response = await axios.post<ProtectResponse>(
      `${API_BASE_URL}/protect`,
      {
        fileId,
        password,
        permissions,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}

export interface UnlockResponse {
  outputFileId: string;
  downloadUrl: string;
}

/**
 * Unlock a password-protected PDF file
 * @param fileId - File ID to unlock
 * @param password - Password to decrypt the PDF
 * @returns Response with output file ID and download URL
 */
export async function unlockFile(
  fileId: string,
  password: string
): Promise<UnlockResponse> {
  try {
    const response = await axios.post<UnlockResponse>(
      `${API_BASE_URL}/unlock`,
      {
        fileId,
        password,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as UploadError;
    }
    throw {
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to the server",
      },
    } as UploadError;
  }
}
