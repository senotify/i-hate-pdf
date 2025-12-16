import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { encrypt } from "node-qpdf2";
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

/**
 * POST /api/protect
 * Protect a PDF with password and permissions
 */
router.post("/protect", async (req: Request, res: Response) => {
  try {
    const { fileId, password, permissions } = req.body as {
      fileId: string;
      password: string;
      permissions?: {
        printing: boolean;
        modifying: boolean;
        copying: boolean;
        annotating: boolean;
      };
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

    if (!password || typeof password !== "string") {
      const error: ErrorResponse = {
        error: {
          code: "INVALID_INPUT",
          message: "password must be a string",
        },
      };
      return res.status(400).json(error);
    }

    // Set default permissions (all allowed)
    const finalPermissions = permissions || {
      printing: true,
      modifying: true,
      copying: true,
      annotating: true,
    };

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

    // Get input file path
    let inputPath: string;
    let tempInputPath: string | null = null;

    if (metadata.storageType === "cloudinary" && metadata.cloudinaryPublicId) {
      // Download from Cloudinary to temp file
      const pdfBytes = await downloadFromCloudinary(
        metadata.cloudinaryPublicId
      );
      tempInputPath = path.join(getUploadDirectory(), `temp_${Date.now()}.pdf`);
      fs.writeFileSync(tempInputPath, pdfBytes);
      inputPath = tempInputPath;
    } else {
      inputPath = metadata.storedPath;
    }

    // Generate output filename and path
    const outputFilename = `protected_${Date.now()}.pdf`;
    const outputPath = path.join(getUploadDirectory(), outputFilename);

    // Encrypt the PDF using node-qpdf2
    const encryptOptions: any = {
      input: inputPath,
      output: outputPath,
      password: password,
      keyLength: 256,
    };

    // Set restrictions based on permissions
    const restrictions: string[] = [];
    if (!finalPermissions.printing) {
      restrictions.push("print");
    }
    if (!finalPermissions.modifying) {
      restrictions.push("modify");
    }
    if (!finalPermissions.copying) {
      restrictions.push("extract");
    }
    if (!finalPermissions.annotating) {
      restrictions.push("annotate");
    }

    if (restrictions.length > 0) {
      encryptOptions.restrictions = restrictions;
    }

    await encrypt(encryptOptions);

    // Clean up temp input file if created
    if (tempInputPath) {
      fs.unlinkSync(tempInputPath);
    }

    // Read the protected PDF
    const protectedBuffer = fs.readFileSync(outputPath);

    // Create metadata
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        protectedBuffer,
        outputFilename
      );

      // Delete local file after upload
      fs.unlinkSync(outputPath);

      // Create metadata for protected file
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
      // Create metadata for protected file (already saved locally)
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        protectedBuffer.length,
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
    console.error("Protect error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "PROTECT_ERROR",
        message: "An error occurred while protecting the PDF",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
