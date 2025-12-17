import { Router, Request, Response } from "express";
import { PDFDocument, rgb } from "pdf-lib";
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
import { detectFileType, getMimeType } from "../utils/fileValidation";
import { convert as pdfPoppler } from "pdf-poppler";
import sharp from "sharp";

const router = Router();
const USE_CLOUDINARY = isCloudinaryConfigured();

// Supported conversion formats
const SUPPORTED_PDF_TO_FORMATS = ["png", "jpeg", "jpg"];
const SUPPORTED_TO_PDF_FORMATS = ["png", "jpeg", "jpg"];

/**
 * POST /api/convert
 * Convert a file to another format
 */
router.post("/convert", async (req: Request, res: Response) => {
  try {
    const { fileId, outputFormat } = req.body;

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

    if (!outputFormat || typeof outputFormat !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "outputFormat must be a valid string",
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

    // Load file bytes based on storage type
    let fileBytes: Buffer;
    if (metadata.storageType === "cloudinary" && metadata.cloudinaryPublicId) {
      fileBytes = await downloadFromCloudinary(metadata.cloudinaryPublicId);
    } else {
      fileBytes = fs.readFileSync(metadata.storedPath);
    }

    // Detect input file type
    const tempPath = path.join(getUploadDirectory(), `temp_${Date.now()}`);
    fs.writeFileSync(tempPath, fileBytes);
    const inputType = detectFileType(tempPath);
    fs.unlinkSync(tempPath);

    // Validate conversion based on input and output types
    const normalizedOutputFormat = outputFormat.toLowerCase();

    if (inputType === "pdf") {
      if (!SUPPORTED_PDF_TO_FORMATS.includes(normalizedOutputFormat)) {
        const error: ErrorResponse = {
          error: {
            code: "UNSUPPORTED_FORMAT",
            message: `Unsupported output format. Supported formats for PDF: ${SUPPORTED_PDF_TO_FORMATS.join(
              ", "
            )}`,
          },
        };
        return res.status(400).json(error);
      }

      // Convert PDF to image
      const result = await convertPdfToImage(
        fileBytes,
        normalizedOutputFormat,
        fileId
      );
      return res.status(200).json(result);
    } else if (inputType === "png" || inputType === "jpeg") {
      if (normalizedOutputFormat !== "pdf") {
        const error: ErrorResponse = {
          error: {
            code: "UNSUPPORTED_FORMAT",
            message: `Unsupported output format. Images can only be converted to PDF`,
          },
        };
        return res.status(400).json(error);
      }

      // Convert image to PDF
      const result = await convertImageToPdf(fileBytes, inputType, fileId);
      return res.status(200).json(result);
    } else {
      const error: ErrorResponse = {
        error: {
          code: "UNSUPPORTED_FORMAT",
          message: `Unsupported input file type. Supported formats: PDF, PNG, JPEG`,
        },
      };
      return res.status(400).json(error);
    }
  } catch (error) {
    console.error("Convert error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "CONVERT_ERROR",
        message: "An error occurred during file conversion",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * Convert PDF to image format
 */
async function convertPdfToImage(
  pdfBytes: Buffer,
  format: string,
  sourceFileId: string
): Promise<any> {
  const tempInputPath = path.join(
    getUploadDirectory(),
    `temp_pdf_${Date.now()}.pdf`
  );
  const tempOutputDir = getUploadDirectory();

  try {
    // Write PDF to temporary file
    fs.writeFileSync(tempInputPath, pdfBytes);

    // Convert PDF to image using pdf-poppler
    // This converts the first page to PNG
    const options = {
      format: "png" as const,
      out_dir: tempOutputDir,
      out_prefix: `temp_convert_${Date.now()}`,
      page: 1, // Convert only first page
    };

    await pdfPoppler(tempInputPath, options);

    // Read the generated PNG file
    const generatedPngPath = path.join(
      tempOutputDir,
      `${options.out_prefix}-1.png`
    );
    let imageBuffer: Buffer = fs.readFileSync(generatedPngPath);

    // Convert to requested format using sharp if needed
    const extension = format === "jpeg" || format === "jpg" ? "jpg" : format;
    if (extension === "jpg") {
      imageBuffer = Buffer.from(
        await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer()
      );
    } else if (extension === "png") {
      imageBuffer = Buffer.from(await sharp(imageBuffer).png().toBuffer());
    }

    // Generate output filename
    const outputFilename = `converted_${Date.now()}.${extension}`;
    const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        imageBuffer,
        outputFilename
      );

      // Create metadata for converted file
      outputMetadata = createFileMetadata(
        outputFilename,
        cloudinaryResult.publicId,
        mimeType,
        cloudinaryResult.bytes,
        true,
        [sourceFileId],
        "cloudinary",
        cloudinaryResult.publicId,
        cloudinaryResult.secureUrl
      );
    } else {
      // Save to local storage
      const outputPath = path.join(getUploadDirectory(), outputFilename);
      fs.writeFileSync(outputPath, imageBuffer);

      // Create metadata for converted file
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        mimeType,
        imageBuffer.length,
        true,
        [sourceFileId],
        "local"
      );
    }

    // Store metadata
    metadataStorage.set(outputMetadata.fileId, outputMetadata);

    // Clean up temporary PNG file
    if (fs.existsSync(generatedPngPath)) {
      fs.unlinkSync(generatedPngPath);
    }

    return {
      outputFileId: outputMetadata.fileId,
      downloadUrl: `/api/download/${outputMetadata.fileId}`,
    };
  } finally {
    // Clean up temporary PDF file
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
  }
}

/**
 * Convert image to PDF
 */
async function convertImageToPdf(
  imageBytes: Buffer,
  imageType: "png" | "jpeg",
  sourceFileId: string
): Promise<any> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed the image
  let image;
  if (imageType === "png") {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    image = await pdfDoc.embedJpg(imageBytes);
  }

  // Get image dimensions
  const { width, height } = image.scale(1);

  // Add a page with the same dimensions as the image
  const page = pdfDoc.addPage([width, height]);

  // Draw the image on the page
  page.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Generate output filename
  const outputFilename = `converted_${Date.now()}.pdf`;
  let outputMetadata;

  if (USE_CLOUDINARY) {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(
      pdfBuffer,
      outputFilename
    );

    // Create metadata for converted file
    outputMetadata = createFileMetadata(
      outputFilename,
      cloudinaryResult.publicId,
      "application/pdf",
      cloudinaryResult.bytes,
      true,
      [sourceFileId],
      "cloudinary",
      cloudinaryResult.publicId,
      cloudinaryResult.secureUrl
    );
  } else {
    // Save to local storage
    const outputPath = path.join(getUploadDirectory(), outputFilename);
    fs.writeFileSync(outputPath, pdfBuffer);

    // Create metadata for converted file
    outputMetadata = createFileMetadata(
      outputFilename,
      outputPath,
      "application/pdf",
      pdfBuffer.length,
      true,
      [sourceFileId],
      "local"
    );
  }

  // Store metadata
  metadataStorage.set(outputMetadata.fileId, outputMetadata);

  return {
    outputFileId: outputMetadata.fileId,
    downloadUrl: `/api/download/${outputMetadata.fileId}`,
  };
}

export default router;
