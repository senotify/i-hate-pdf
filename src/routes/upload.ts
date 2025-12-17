import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getUploadDirectory } from "../utils/storage";
import {
  isValidPDF,
  getPDFMimeType,
  sanitizeFilename,
  validateFile,
} from "../utils/fileValidation";
import {
  createFileMetadata,
  metadataStorage,
  generateFileId,
} from "../utils/metadata";
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from "../utils/cloudinaryStorage";
import { ErrorResponse } from "../types";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { uploadRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Determine storage type based on environment
const USE_CLOUDINARY = isCloudinaryConfigured();
console.log("=== Cloudinary Configuration ===");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  "CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET"
);
console.log(
  "CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET"
);
console.log("USE_CLOUDINARY:", USE_CLOUDINARY);
console.log("================================");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDirectory());
  },
  filename: (req, file, cb) => {
    // Generate UUID filename with original extension
    const fileId = generateFileId();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600"), // 100MB default
  },
});

/**
 * POST /api/upload
 * Upload a PDF file
 */
router.post(
  "/upload",
  uploadRateLimiter,
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    let localFilePath: string | undefined;

    try {
      if (!req.file) {
        throw new AppError(400, "NO_FILE", "No file was uploaded");
      }

      localFilePath = req.file.path;

      // Sanitize the original filename
      const sanitizedFilename = sanitizeFilename(req.file.originalname);

      // Comprehensive file validation
      const maxFileSize = parseInt(
        process.env.MAX_FILE_SIZE || "104857600",
        10
      );
      const validation = validateFile(
        localFilePath,
        getUploadDirectory(),
        maxFileSize
      );

      if (!validation.valid) {
        // Delete the invalid file
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }

        throw new AppError(
          400,
          "INVALID_FILE",
          validation.error || "File validation failed"
        );
      }

      let metadata;

      if (USE_CLOUDINARY) {
        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(localFilePath);

        // Create file metadata with Cloudinary info
        metadata = createFileMetadata(
          sanitizedFilename,
          cloudinaryResult.publicId, // Store public ID as path
          getPDFMimeType(),
          cloudinaryResult.bytes,
          false,
          undefined,
          "cloudinary",
          cloudinaryResult.publicId,
          cloudinaryResult.secureUrl
        );

        // Delete local file after successful upload to Cloudinary
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } else {
        // Use local storage
        metadata = createFileMetadata(
          sanitizedFilename,
          localFilePath,
          getPDFMimeType(),
          req.file.size,
          false,
          undefined,
          "local"
        );
      }

      // Store metadata
      metadataStorage.set(metadata.fileId, metadata);

      // Return file metadata
      res.status(200).json({
        fileId: metadata.fileId,
        filename: metadata.originalName,
        size: metadata.size,
      });
    } catch (error) {
      // Clean up local file if it exists
      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (cleanupError) {
          console.error("Failed to clean up file:", cleanupError);
        }
      }

      // Re-throw AppError or wrap in generic error
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        500,
        "UPLOAD_ERROR",
        "An error occurred during file upload",
        error instanceof Error ? error.message : String(error)
      );
    }
  })
);

export default router;
