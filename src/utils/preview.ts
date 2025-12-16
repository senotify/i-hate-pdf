import { PDFDocument } from "pdf-lib";
import fs from "fs";
import {
  downloadFromCloudinary,
  isCloudinaryConfigured,
} from "./cloudinaryStorage";

const USE_CLOUDINARY = isCloudinaryConfigured();

export interface PagePreview {
  pageNumber: number;
  thumbnailDataUrl?: string; // Optional: base64 encoded thumbnail
}

/**
 * Generate page previews for a PDF file
 * Returns an array of page information with page numbers
 *
 * Note: This implementation returns page metadata. For actual thumbnail generation,
 * consider using pdf-poppler or similar libraries that can render PDFs to images.
 *
 * @param filePath - Path to the PDF file (local path or Cloudinary public ID)
 * @param storageType - Storage type ("local" or "cloudinary")
 * @param cloudinaryPublicId - Cloudinary public ID if using cloud storage
 * @returns Array of page preview objects
 */
export async function generatePagePreviews(
  filePath: string,
  storageType: "local" | "cloudinary" = "local",
  cloudinaryPublicId?: string
): Promise<PagePreview[]> {
  try {
    // Load PDF bytes based on storage type
    let pdfBytes: Buffer;
    if (storageType === "cloudinary" && cloudinaryPublicId) {
      pdfBytes = await downloadFromCloudinary(cloudinaryPublicId);
    } else {
      pdfBytes = fs.readFileSync(filePath);
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // Generate preview information for each page
    const previews: PagePreview[] = [];
    for (let i = 0; i < pageCount; i++) {
      previews.push({
        pageNumber: i + 1, // 1-indexed page numbers
      });
    }

    return previews;
  } catch (error) {
    throw new Error(
      `Failed to generate page previews: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get the total page count for a PDF file
 *
 * @param filePath - Path to the PDF file (local path or Cloudinary public ID)
 * @param storageType - Storage type ("local" or "cloudinary")
 * @param cloudinaryPublicId - Cloudinary public ID if using cloud storage
 * @returns Total number of pages
 */
export async function getPageCount(
  filePath: string,
  storageType: "local" | "cloudinary" = "local",
  cloudinaryPublicId?: string
): Promise<number> {
  try {
    // Load PDF bytes based on storage type
    let pdfBytes: Buffer;
    if (storageType === "cloudinary" && cloudinaryPublicId) {
      pdfBytes = await downloadFromCloudinary(cloudinaryPublicId);
    } else {
      pdfBytes = fs.readFileSync(filePath);
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    throw new Error(
      `Failed to get page count: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
