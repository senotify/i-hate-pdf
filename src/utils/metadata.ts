import { FileMetadata } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * In-memory storage for file metadata
 */
class MetadataStorage {
  private storage: Map<string, FileMetadata> = new Map();

  /**
   * Store file metadata
   */
  set(fileId: string, metadata: FileMetadata): void {
    this.storage.set(fileId, metadata);
  }

  /**
   * Retrieve file metadata by ID
   */
  get(fileId: string): FileMetadata | undefined {
    return this.storage.get(fileId);
  }

  /**
   * Delete file metadata by ID
   */
  delete(fileId: string): boolean {
    return this.storage.delete(fileId);
  }

  /**
   * Get all file metadata entries
   */
  getAll(): FileMetadata[] {
    return Array.from(this.storage.values());
  }

  /**
   * Get all expired files
   */
  getExpired(): FileMetadata[] {
    const now = new Date();
    return this.getAll().filter((metadata) => metadata.expiresAt < now);
  }

  /**
   * Clear all metadata
   */
  clear(): void {
    this.storage.clear();
  }
}

// Singleton instance
export const metadataStorage = new MetadataStorage();

/**
 * Generate a unique file ID using UUID v4
 */
export function generateFileId(): string {
  return uuidv4();
}

/**
 * Calculate expiration time based on retention period
 * @param retentionMinutes - Number of minutes until expiration (default: 60)
 * @returns Date object representing expiration time
 */
export function calculateExpirationTime(retentionMinutes: number = 60): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + retentionMinutes);
  return expiresAt;
}

/**
 * Create file metadata object
 */
export function createFileMetadata(
  originalName: string,
  storedPath: string,
  mimeType: string,
  size: number,
  isProcessed: boolean = false,
  sourceFileIds?: string[],
  storageType: "local" | "cloudinary" = "local",
  cloudinaryPublicId?: string,
  cloudinaryUrl?: string
): FileMetadata {
  const fileId = generateFileId();
  const uploadedAt = new Date();
  const expiresAt = calculateExpirationTime();

  return {
    fileId,
    originalName,
    storedPath,
    cloudinaryPublicId,
    cloudinaryUrl,
    mimeType,
    size,
    uploadedAt,
    expiresAt,
    isProcessed,
    sourceFileIds,
    storageType,
  };
}
