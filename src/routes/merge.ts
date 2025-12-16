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
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

/**
 * POST /api/merge
 * Merge multiple PDF files into a single PDF
 */
router.post(
  "/merge",
  asyncHandler(async (req: Request, res: Response) => {
    const { fileIds } = req.body;

    // Validate input
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new AppError(
        400,
        "INVALID_INPUT",
        "fileIds must be a non-empty array"
      );
    }

    // Retrieve metadata for all files
    const metadataList = fileIds.map((id) => metadataStorage.get(id));

    // Check if all files exist
    const missingFiles = fileIds.filter((id, index) => !metadataList[index]);
    if (missingFiles.length > 0) {
      throw new AppError(404, "FILE_NOT_FOUND", "One or more files not found", {
        missingFileIds: missingFiles,
      });
    }

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();

    // Load and merge each PDF in order
    for (const metadata of metadataList) {
      if (!metadata) continue;

      let pdfBytes: Buffer;

      // Load PDF bytes based on storage type
      if (
        metadata.storageType === "cloudinary" &&
        metadata.cloudinaryPublicId
      ) {
        pdfBytes = await downloadFromCloudinary(metadata.cloudinaryPublicId);
      } else {
        if (!fs.existsSync(metadata.storedPath)) {
          throw new AppError(
            404,
            "FILE_NOT_FOUND",
            `File ${metadata.fileId} not found in storage`
          );
        }
        pdfBytes = fs.readFileSync(metadata.storedPath);
      }

      // Load the PDF document
      const pdf = await PDFDocument.load(pdfBytes);

      // Copy all pages from this PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const mergedBuffer = Buffer.from(mergedPdfBytes);

    // Generate output filename
    const outputFilename = `merged_${Date.now()}.pdf`;
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        mergedBuffer,
        outputFilename
      );

      // Create metadata for merged file
      outputMetadata = createFileMetadata(
        outputFilename,
        cloudinaryResult.publicId,
        "application/pdf",
        cloudinaryResult.bytes,
        true,
        fileIds,
        "cloudinary",
        cloudinaryResult.publicId,
        cloudinaryResult.secureUrl
      );
    } else {
      // Save to local storage
      const outputPath = path.join(getUploadDirectory(), outputFilename);
      fs.writeFileSync(outputPath, mergedBuffer);

      // Create metadata for merged file
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        mergedBuffer.length,
        true,
        fileIds,
        "local"
      );
    }

    // Store metadata
    metadataStorage.set(outputMetadata.fileId, outputMetadata);

    // Return response
    res.status(200).json({
      outputFileId: outputMetadata.fileId,
      downloadUrl: `/api/download/${outputMetadata.fileId}`,
    });
  })
);

export default router;
