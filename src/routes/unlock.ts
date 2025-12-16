import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { decrypt } from "node-qpdf2";
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
 * POST /api/unlock
 * Unlock a password-protected PDF
 */
router.post("/unlock", async (req: Request, res: Response) => {
  try {
    const { fileId, password } = req.body as {
      fileId: string;
      password: string;
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
    const outputFilename = `unlocked_${Date.now()}.pdf`;
    const outputPath = path.join(getUploadDirectory(), outputFilename);

    // Try to decrypt the PDF using node-qpdf2
    try {
      await decrypt({
        input: inputPath,
        output: outputPath,
        password: password,
      });
    } catch (error) {
      // Clean up temp input file if created
      if (tempInputPath) {
        fs.unlinkSync(tempInputPath);
      }

      // If decryption fails, it's likely due to incorrect password
      const errorResponse: ErrorResponse = {
        error: {
          code: "INCORRECT_PASSWORD",
          message: "Incorrect password provided",
        },
      };
      return res.status(401).json(errorResponse);
    }

    // Clean up temp input file if created
    if (tempInputPath) {
      fs.unlinkSync(tempInputPath);
    }

    // Read the unlocked PDF
    const unlockedBuffer = fs.readFileSync(outputPath);

    // Create metadata
    let outputMetadata;

    if (USE_CLOUDINARY) {
      // Upload to Cloudinary
      const cloudinaryResult = await uploadBufferToCloudinary(
        unlockedBuffer,
        outputFilename
      );

      // Delete local file after upload
      fs.unlinkSync(outputPath);

      // Create metadata for unlocked file
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
      // Create metadata for unlocked file (already saved locally)
      outputMetadata = createFileMetadata(
        outputFilename,
        outputPath,
        "application/pdf",
        unlockedBuffer.length,
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
    console.error("Unlock error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "UNLOCK_ERROR",
        message: "An error occurred while unlocking the PDF",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
