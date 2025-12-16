// Type definitions for the PDF Toolkit Frontend

export interface FileMetadata {
  fileId: string;
  originalName: string;
  storedPath: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  expiresAt: Date;
  isProcessed: boolean;
  sourceFileIds?: string[];
  storageType: "local" | "cloudinary";
}

export type OperationType =
  | "merge"
  | "split"
  | "compress"
  | "convert"
  | "rotate"
  | "delete"
  | "reorder"
  | "watermark"
  | "page-numbers"
  | "protect"
  | "unlock";

export interface Operation {
  type: OperationType;
  params: Record<string, any>;
}

export interface PageRange {
  start: number;
  end: number;
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

export interface Permissions {
  printing: boolean;
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
}

export interface ProtectionOptions {
  password: string;
  permissions: Permissions;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
