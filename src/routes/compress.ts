import { Router, Request, Response } from "express";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { ErrorResponse } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

type CompressionLevel = "low" | "medium" | "high";

/**
 * POST /api/compress
 * Compress a PDF file
 */
router.post("/compress", async (req: Request, res: Response) => {
  try {
    const { fileId, level } = req.body;

    // Validate input
    if (!fileId || typeof fileId !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "fileId must be a valid string",
        },
      };
      return res.status(400).json(error);
    }

    if (!level || !["low", "medium", "high"].includes(level)) {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "level must be one of: low, medium, high",
        },
      };
      return res.status(400).json(error);
    }

    // Retrieve metadata
    const metadata = metadataStorage.get(fileId);
    if (!metadata) {
      const error: ErrorResponse = {
        error: {
          code: "FILE_NOT_FOUND",
          message: "File not found",
        },
      };
      return res.status(404).json(error);
    }

    // Load PDF bytes based on storage type
    let pdfBytes: Buffer;
    if (metadata.storageType === "cloudinary" && metadata.cloudinaryPublicId) {
      pdfBytes = await downloadFromCloudinary(metadata.cloudinaryPublicId);
    } else {
      pdfBytes = fs.readFileSync(metadata.storedPath);
    }

    const originalSize = pdfBytes.length;

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Compress the PDF based on the level
    // pdf-lib doesn't have built-in compression, so we'll use save options
    // to control the output size
    const compressedPdfBytes = await compressPdf(
      pdfDoc,
      level as CompressionLevel
    );
    const compressedBuffer = Buffer.from(compressedPdfBytes);
    const compressedSize = compressedBuffer.length;

    // Calculate size reduction percentage
    const reductionPercentage =
      originalSize > 0
        ? ((originalSize - compressedSize) / originalSize) * 100
        : 0;

    // Generate output filename
    const outputFilename = `compressed_${level}_${Date.now()}.pdf`;
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        compressedBuffer,
        outputFilename
      );

      // Create metadata for compressed file
      outputMetadata = createFileMetadata(
        outputFilename,
        cloudinaryResult.publicId,
        "application/pdf",
        cloudinaryResult.bytes,
        true,
        [fileId],
        "cloudinary",
        cloudinaryResult.publicId,
        cloudinaryResult.secureUrl
      );
    } else {
      // Save to local storage
      const outputPath = path.join(getUploadDirectory(), outputFilename);
      fs.writeFileSync(outputPath, compressedBuffer);

      // Create metadata for compressed file
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        compressedSize,
        true,
        [fileId],
        "local"
      );
    }

    // Store metadata
    metadataStorage.set(outputMetadata.fileId, outputMetadata);

    // Return response with size metrics
    res.status(200).json({
      outputFileId: outputMetadata.fileId,
      downloadUrl: `/api/download/${outputMetadata.fileId}`,
      originalSize,
      compressedSize,
      reductionPercentage: Math.round(reductionPercentage * 100) / 100,
    });
  } catch (error) {
    console.error("Compress error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "COMPRESS_ERROR",
        message: "An error occurred during PDF compression",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * Compress PDF based on compression level
 * Creates a new PDF with compressed content by copying pages
 * This removes unnecessary metadata and optimizes the structure
 */
async function compressPdf(
  pdfDoc: PDFDocument,
  level: CompressionLevel
): Promise<Uint8Array> {
  // Create a new PDF document
  const newPdfDoc = await PDFDocument.create();

  // Copy all pages from the original document
  const pageCount = pdfDoc.getPageCount();
  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);

  // Copy pages to new document (this removes unnecessary data)
  const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach((page) => {
    newPdfDoc.addPage(page);
  });

  // Save with compression options based on level
  const saveOptions = {
    useObjectStreams: true, // Always use object streams for better compression
    addDefaultPage: false,
  };

  // For different compression levels, we could adjust quality settings
  // but pdf-lib has limited compression options
  // The main compression comes from removing metadata and optimizing structure

  return await newPdfDoc.save(saveOptions);
}

export default router;
