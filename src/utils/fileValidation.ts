import fs from "fs";
import path from "path";

/**
 * PDF magic numbers (file signatures)
 * PDFs start with %PDF-
 */
const PDF_MAGIC_NUMBERS = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

/**
 * PNG magic numbers
 */
const PNG_MAGIC_NUMBERS = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * JPEG magic numbers (starts with FF D8 FF)
 */
const JPEG_MAGIC_NUMBERS = [0xff, 0xd8, 0xff];

/**
 * Validate if a file is a valid PDF using magic numbers
 * @param filePath - Path to the file to validate
 * @returns true if file is a valid PDF, false otherwise
 */
export function isValidPDF(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);

    // Check if the first 5 bytes match PDF magic numbers
    for (let i = 0; i < PDF_MAGIC_NUMBERS.length; i++) {
      if (buffer[i] !== PDF_MAGIC_NUMBERS[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate if a file is a valid PNG using magic numbers
 */
export function isValidPNG(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    for (let i = 0; i < PNG_MAGIC_NUMBERS.length; i++) {
      if (buffer[i] !== PNG_MAGIC_NUMBERS[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate if a file is a valid JPEG using magic numbers
 */
export function isValidJPEG(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(3);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 3, 0);
    fs.closeSync(fd);

    for (let i = 0; i < JPEG_MAGIC_NUMBERS.length; i++) {
      if (buffer[i] !== JPEG_MAGIC_NUMBERS[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Detect file type based on magic numbers
 */
export function detectFileType(
  filePath: string
): "pdf" | "png" | "jpeg" | "unknown" {
  if (isValidPDF(filePath)) return "pdf";
  if (isValidPNG(filePath)) return "png";
  if (isValidJPEG(filePath)) return "jpeg";
  return "unknown";
}

/**
 * Get MIME type for PDF files
 */
export function getPDFMimeType(): string {
  return "application/pdf";
}

/**
 * Get MIME type based on format
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
  };
  return mimeTypes[format.toLowerCase()] || "application/octet-stream";
}

/**
 * Sanitize filename to prevent directory traversal and other security issues
 * Removes path separators, null bytes, and control characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "unnamed";
  }

  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[\/\\]/g, "") // Remove forward and back slashes
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
    .replace(/^\.+/, "") // Remove leading dots
    .trim();

  // If filename is empty after sanitization, use default
  if (!sanitized) {
    return "unnamed";
  }

  // Limit filename length (255 is typical filesystem limit)
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf("."));
    const name = sanitized.slice(0, 255 - ext.length);
    sanitized = name + ext;
  }

  return sanitized;
}

/**
 * Validate file path to prevent directory traversal attacks
 * Ensures the resolved path is within the allowed directory
 * @param filePath - Path to validate
 * @param allowedDirectory - Base directory that should contain the file
 * @returns true if path is safe, false otherwise
 */
export function isPathSafe(
  filePath: string,
  allowedDirectory: string
): boolean {
  try {
    // Resolve both paths to absolute paths
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(allowedDirectory);

    // Normalize paths to handle different separators
    const normalizedPath = path.normalize(resolvedPath);
    const normalizedBase = path.normalize(resolvedBase);

    // Check if the resolved path starts with the base directory
    // This prevents directory traversal attacks like ../../etc/passwd
    return (
      normalizedPath.startsWith(normalizedBase + path.sep) ||
      normalizedPath === normalizedBase
    );
  } catch (error) {
    return false;
  }
}

/**
 * Validate file size
 * @param filePath - Path to the file
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns true if file size is within limit, false otherwise
 */
export function isFileSizeValid(
  filePath: string,
  maxSizeBytes: number
): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.size <= maxSizeBytes;
  } catch (error) {
    return false;
  }
}

/**
 * Comprehensive file validation
 * Validates file type, size, and path safety
 * @param filePath - Path to the file
 * @param allowedDirectory - Base directory that should contain the file
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Object with validation result and error message if invalid
 */
export function validateFile(
  filePath: string,
  allowedDirectory: string,
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  // Check path safety
  if (!isPathSafe(filePath, allowedDirectory)) {
    return {
      valid: false,
      error: "Invalid file path: potential directory traversal attack",
    };
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: "File does not exist" };
  }

  // Check file size
  if (!isFileSizeValid(filePath, maxSizeBytes)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeBytes} bytes`,
    };
  }

  // Check file type (PDF)
  if (!isValidPDF(filePath)) {
    return { valid: false, error: "File is not a valid PDF" };
  }

  return { valid: true };
}
