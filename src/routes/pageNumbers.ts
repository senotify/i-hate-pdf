import { Router, Request, Response } from "express";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { ErrorResponse, PageNumberOptions } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

/**
 * POST /api/page-numbers
 * Add page numbers to a PDF
 */
router.post("/page-numbers", async (req: Request, res: Response) => {
  try {
    const { fileId, options } = req.body as {
      fileId: string;
      options: PageNumberOptions;
    };

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

    if (!options || typeof options !== "object") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "options must be an object",
        },
      };
      return res.status(400).json(error);
    }

    // Validate required options
    if (!options.format || typeof options.format !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "options.format must be a string",
        },
      };
      return res.status(400).json(error);
    }

    if (!options.position || typeof options.position !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "options.position must be a string",
        },
      };
      return res.status(400).json(error);
    }

    // Set defaults
    const fontSize = options.fontSize || 12;
    const startNumber = options.startNumber || 1;
    const fontFamily = options.fontFamily || "Helvetica";

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
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add page numbers to each page
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Format the page number text
      const pageNumber = startNumber + i;
      const text = options.format
        .replace("{n}", pageNumber.toString())
        .replace("{total}", totalPages.toString());

      // Calculate position
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = fontSize;

      let x: number;
      let y: number;

      switch (options.position) {
        case "top-center":
          x = (width - textWidth) / 2;
          y = height - textHeight - 20;
          break;
        case "bottom-center":
          x = (width - textWidth) / 2;
          y = 20;
          break;
        case "top-left":
          x = 20;
          y = height - textHeight - 20;
          break;
        case "top-right":
          x = width - textWidth - 20;
          y = height - textHeight - 20;
          break;
        case "bottom-left":
          x = 20;
          y = 20;
          break;
        case "bottom-right":
          x = width - textWidth - 20;
          y = 20;
          break;
        default:
          x = (width - textWidth) / 2;
          y = 20;
      }

      // Draw the text
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedBuffer = Buffer.from(modifiedPdfBytes);

    // Generate output filename
    const outputFilename = `page_numbers_${Date.now()}.pdf`;
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        modifiedBuffer,
        outputFilename
      );

      // Create metadata for modified file
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
      fs.writeFileSync(outputPath, modifiedBuffer);

      // Create metadata for modified file
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        modifiedBuffer.length,
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
    console.error("Page numbers error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "PAGE_NUMBERS_ERROR",
        message: "An error occurred while adding page numbers",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
