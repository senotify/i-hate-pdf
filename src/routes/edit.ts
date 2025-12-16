import { Router, Request, Response } from "express";
import { PDFDocument, degrees } from "pdf-lib";
import fs from "fs";
import path from "path";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { ErrorResponse, Operation } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

/**
 * POST /api/edit
 * Edit a PDF by applying operations: rotate, delete, reorder
 */
router.post("/edit", async (req: Request, res: Response) => {
  try {
    const { fileId, operations } = req.body;

    // Validate input
    if (!fileId || typeof fileId !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "fileId must be a string",
        },
      };
      return res.status(400).json(error);
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "operations must be a non-empty array",
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

    // Load PDF bytes
    let pdfBytes: Buffer;
    if (metadata.storageType === "cloudinary" && metadata.cloudinaryPublicId) {
      pdfBytes = await downloadFromCloudinary(metadata.cloudinaryPublicId);
    } else {
      pdfBytes = fs.readFileSync(metadata.storedPath);
    }

    // Load the PDF document
    let pdfDoc = await PDFDocument.load(pdfBytes);

    // Apply operations in sequence
    for (const operation of operations) {
      pdfDoc = await applyOperation(pdfDoc, operation);
    }

    // Save the edited PDF
    const editedPdfBytes = await pdfDoc.save();
    const editedBuffer = Buffer.from(editedPdfBytes);

    // Generate output filename
    const outputFilename = `edited_${Date.now()}.pdf`;
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        editedBuffer,
        outputFilename
      );

      // Create metadata for edited file
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
      fs.writeFileSync(outputPath, editedBuffer);

      // Create metadata for edited file
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        editedBuffer.length,
        true,
        [fileId],
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
  } catch (error) {
    console.error("Edit error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "EDIT_ERROR",
        message: "An error occurred during PDF edit",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * Apply a single operation to a PDF document
 */
async function applyOperation(
  pdfDoc: PDFDocument,
  operation: Operation
): Promise<PDFDocument> {
  switch (operation.type) {
    case "rotate":
      return applyRotate(pdfDoc, operation.params);
    case "delete":
      return applyDelete(pdfDoc, operation.params);
    case "reorder":
      return applyReorder(pdfDoc, operation.params);
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

/**
 * Rotate specified pages by 90° increments
 * params: { pageIndices: number[], rotation: number }
 */
function applyRotate(
  pdfDoc: PDFDocument,
  params: { pageIndices: number[]; rotation: number }
): PDFDocument {
  const { pageIndices, rotation } = params;

  // Validate rotation (must be multiple of 90)
  if (rotation % 90 !== 0) {
    throw new Error("Rotation must be a multiple of 90 degrees");
  }

  // Validate page indices
  const totalPages = pdfDoc.getPageCount();
  for (const index of pageIndices) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  // Apply rotation to specified pages
  for (const index of pageIndices) {
    const page = pdfDoc.getPage(index);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotation));
  }

  return pdfDoc;
}

/**
 * Delete specified pages
 * params: { pageIndices: number[] }
 */
function applyDelete(
  pdfDoc: PDFDocument,
  params: { pageIndices: number[] }
): PDFDocument {
  const { pageIndices } = params;

  // Validate page indices
  const totalPages = pdfDoc.getPageCount();
  for (const index of pageIndices) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  // Sort indices in descending order to avoid index shifting issues
  const sortedIndices = [...pageIndices].sort((a, b) => b - a);

  // Remove pages
  for (const index of sortedIndices) {
    pdfDoc.removePage(index);
  }

  return pdfDoc;
}

/**
 * Reorder pages according to new sequence
 * params: { newOrder: number[] }
 */
async function applyReorder(
  pdfDoc: PDFDocument,
  params: { newOrder: number[] }
): Promise<PDFDocument> {
  const { newOrder } = params;

  // Validate new order
  const totalPages = pdfDoc.getPageCount();
  if (newOrder.length !== totalPages) {
    throw new Error(
      `New order must contain exactly ${totalPages} page indices`
    );
  }

  // Check that all indices are valid and unique
  const uniqueIndices = new Set(newOrder);
  if (uniqueIndices.size !== totalPages) {
    throw new Error("New order must contain unique page indices");
  }

  for (const index of newOrder) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  // Create a new PDF with pages in the new order
  const newPdfDoc = await PDFDocument.create();

  for (const index of newOrder) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]);
    newPdfDoc.addPage(copiedPage);
  }

  return newPdfDoc;
}

export default router;
