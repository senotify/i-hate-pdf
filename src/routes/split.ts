import { Router, Request, Response } from "express";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { parsePageRange, pageRangesToNumbers } from "../utils/pageRange";
import { ErrorResponse } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

/**
 * POST /api/split
 * Split a PDF file into multiple PDFs based on page ranges
 */
router.post("/split", async (req: Request, res: Response) => {
  try {
    const { fileId, ranges } = req.body;

    // Validate input
    if (!fileId || typeof fileId !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "fileId must be a non-empty string",
        },
      };
      return res.status(400).json(error);
    }

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "ranges must be a non-empty array of page range strings",
        },
      };
      return res.status(400).json(error);
    }

    // Retrieve metadata for the file
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

    // Load the PDF document
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const totalPages = sourcePdf.getPageCount();

    // Parse all page ranges
    const parsedRanges = ranges.map((rangeStr: string) => {
      try {
        return parsePageRange(rangeStr, totalPages);
      } catch (error) {
        throw new Error(
          `Invalid page range "${rangeStr}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });

    // Create output files
    const outputMetadataList = [];

    for (let i = 0; i < parsedRanges.length; i++) {
      const rangeSet = parsedRanges[i];
      const rangeStr = ranges[i];

      // Create a new PDF for this range
      const outputPdf = await PDFDocument.create();

      // Get all page numbers for this range
      const pageNumbers = pageRangesToNumbers(rangeSet);

      // Copy pages to the new PDF (convert from 1-indexed to 0-indexed)
      const pagesToCopy = pageNumbers.map((pageNum) => pageNum - 1);
      const copiedPages = await outputPdf.copyPages(sourcePdf, pagesToCopy);
      copiedPages.forEach((page) => {
        outputPdf.addPage(page);
      });

      // Save the output PDF
      const outputPdfBytes = await outputPdf.save();
      const outputBuffer = Buffer.from(outputPdfBytes);

      // Generate output filename
      const baseName = path.parse(metadata.originalName).name;
      const outputFilename = `${baseName}_split_${i + 1}_${Date.now()}.pdf`;

      let outputMetadata;

      if (USE_CLOUDINARY) {
        // Upload to Cloudinary
        const cloudinaryResult = await uploadBufferToCloudinary(
          outputBuffer,
          outputFilename
        );

        // Create metadata for split file
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
        fs.writeFileSync(outputPath, outputBuffer);

        // Create metadata for split file
        outputMetadata = createFileMetadata(
          outputFilename,
          outputPath,
          "application/pdf",
          outputBuffer.length,
          true,
          [fileId],
          "local"
        );
      }

      // Store metadata
      metadataStorage.set(outputMetadata.fileId, outputMetadata);
      outputMetadataList.push(outputMetadata);
    }

    // Return response with all output files
    res.status(200).json({
      outputFileIds: outputMetadataList.map((m) => m.fileId),
      downloadUrls: outputMetadataList.map((m) => `/api/download/${m.fileId}`),
    });
  } catch (error) {
    console.error("Split error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "SPLIT_ERROR",
        message: "An error occurred during PDF split",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
