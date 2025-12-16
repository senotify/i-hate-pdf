import { Router, Request, Response } from "express";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";
import { ErrorResponse, WatermarkOptions } from "../types";
import {
  downloadFromCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

/**
 * POST /api/watermark
 * Add a watermark to a PDF
 */
router.post("/watermark", async (req: Request, res: Response) => {
  try {
    const { fileId, options } = req.body as {
      fileId: string;
      options: WatermarkOptions;
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
    if (!options.text || typeof options.text !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "options.text must be a string",
        },
      };
      return res.status(400).json(error);
    }

    // Set defaults
    const fontSize = options.fontSize || 48;
    const opacity = options.opacity !== undefined ? options.opacity : 0.5;
    const rotation = options.rotation || 45;
    const position = options.position || "center";
    const color = options.color || "#808080";

    // Validate opacity range
    if (opacity < 0 || opacity > 1) {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "options.opacity must be between 0 and 1",
        },
      };
      return res.status(400).json(error);
    }

    // Parse color (hex to RGB)
    const rgbColor = parseHexColor(color);

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

    // Add watermark to each page
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Calculate text dimensions
      const textWidth = font.widthOfTextAtSize(options.text, fontSize);
      const textHeight = fontSize;

      // Calculate position
      let x: number;
      let y: number;

      // For center position with rotation, we need special handling
      // pdf-lib rotates text around the x,y point (bottom-left of text)
      // To center rotated text, we calculate where the bottom-left should be
      // so that the text center ends up at page center
      if (position === "center") {
        const radians = (rotation * Math.PI) / 180;
        const cosAngle = Math.cos(radians);
        const sinAngle = Math.sin(radians);

        // Calculate the center of the text in its local coordinate system
        const textCenterX = textWidth / 2;
        const textCenterY = textHeight / 2;

        // Rotate the text center point
        const rotatedCenterX = textCenterX * cosAngle - textCenterY * sinAngle;
        const rotatedCenterY = textCenterX * sinAngle + textCenterY * cosAngle;

        // Position so the rotated center aligns with page center
        x = width / 2 - rotatedCenterX;
        y = height / 2 - rotatedCenterY;
      } else {
        // For corner positions, use simple positioning
        switch (position) {
          case "top-left":
            x = 50;
            y = height - 50 - textHeight;
            break;
          case "top-right":
            x = width - 50 - textWidth;
            y = height - 50 - textHeight;
            break;
          case "bottom-left":
            x = 50;
            y = 50;
            break;
          case "bottom-right":
            x = width - 50 - textWidth;
            y = 50;
            break;
          default:
            x = width / 2 - textWidth / 2;
            y = height / 2 - textHeight / 2;
        }
      }

      // Draw the watermark
      page.drawText(options.text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity,
        rotate: degrees(rotation),
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedBuffer = Buffer.from(modifiedPdfBytes);

    // Generate output filename
    const outputFilename = `watermarked_${Date.now()}.pdf`;
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
    console.error("Watermark error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "WATERMARK_ERROR",
        message: "An error occurred while adding watermark",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * Parse hex color to RGB values (0-1 range)
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

export default router;
