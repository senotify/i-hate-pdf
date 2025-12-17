import { Router, Request, Response } from "express";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { ErrorResponse } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";

const execAsync = promisify(exec);

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
 * Check if Ghostscript is available
 */
async function isGhostscriptAvailable(): Promise<boolean> {
  try {
    await execAsync("gs --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Compress PDF using Ghostscript
 */
async function compressWithGhostscript(
  pdfDoc: PDFDocument,
  level: CompressionLevel
): Promise<Uint8Array> {
  const tempInputPath = path.join(
    getUploadDirectory(),
    `temp_input_${Date.now()}.pdf`
  );
  const tempOutputPath = path.join(
    getUploadDirectory(),
    `temp_output_${Date.now()}.pdf`
  );

  try {
    // Save original PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(tempInputPath, pdfBytes);

    // Ghostscript compression settings based on level
    const settings = {
      low: "printer", // 300 DPI, good quality
      medium: "ebook", // 150 DPI, medium quality
      high: "screen", // 72 DPI, maximum compression
    };

    const pdfsetting = settings[level];

    // Run Ghostscript to compress the PDF
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfsetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tempOutputPath}" "${tempInputPath}"`;

    await execAsync(gsCommand);

    // Read the compressed PDF
    const compressedBytes = fs.readFileSync(tempOutputPath);

    return new Uint8Array(compressedBytes);
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
  }
}

/**
 * Fallback compression using pdf-lib
 * Creates a new PDF document and copies pages to remove metadata
 */
async function compressWithPdfLib(
  pdfDoc: PDFDocument,
  level: CompressionLevel
): Promise<Uint8Array> {
  // Create a new PDF document
  const newPdfDoc = await PDFDocument.create();

  // Copy all pages from the original document
  const pageCount = pdfDoc.getPageCount();
  const copiedPages = await newPdfDoc.copyPages(
    pdfDoc,
    Array.from({ length: pageCount }, (_, i) => i)
  );

  // Add copied pages to the new document
  copiedPages.forEach((page) => {
    newPdfDoc.addPage(page);
  });

  // Save with compression options based on level
  const saveOptions = {
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: level === "high" ? 50 : level === "medium" ? 100 : 200,
  };

  return await newPdfDoc.save(saveOptions);
}

/**
 * Compress PDF based on compression level
 * Uses Ghostscript if available, falls back to pdf-lib
 */
async function compressPdf(
  pdfDoc: PDFDocument,
  level: CompressionLevel
): Promise<Uint8Array> {
  const hasGhostscript = await isGhostscriptAvailable();

  if (hasGhostscript) {
    console.log("Using Ghostscript for compression");
    return await compressWithGhostscript(pdfDoc, level);
  } else {
    console.log("Ghostscript not available, using pdf-lib fallback");
    return await compressWithPdfLib(pdfDoc, level);
  }
}

export default router;
