import { Router, Request, Response } from "express";
import fs from "fs";
import { metadataStorage } from "../utils/metadata";
import { downloadFromCloudinary } from "../utils/cloudinaryStorage";
import { getUploadDirectory } from "../utils/storage";
import { isPathSafe } from "../utils/fileValidation";
import { ErrorResponse } from "../types";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();

/**
 * GET /api/download/:fileId
 * Download a file by ID
 */
router.get(
  "/download/:fileId",
  asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;

    // Get file metadata
    const metadata = metadataStorage.get(fileId);

    if (!metadata) {
      throw new AppError(
        404,
        "FILE_NOT_FOUND",
        "File not found or has expired"
      );
    }

    if (metadata.storageType === "cloudinary" && metadata.cloudinaryPublicId) {
      // Download from Cloudinary
      const buffer = await downloadFromCloudinary(metadata.cloudinaryPublicId);

      // Set response headers
      res.setHeader("Content-Type", metadata.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${metadata.originalName}"`
      );

      res.send(buffer);
    } else if (metadata.storageType === "local") {
      // Validate path safety to prevent directory traversal
      if (!isPathSafe(metadata.storedPath, getUploadDirectory())) {
        throw new AppError(
          403,
          "FORBIDDEN",
          "Access to this file path is not allowed"
        );
      }

      // Check if file exists before setting headers
      if (!fs.existsSync(metadata.storedPath)) {
        throw new AppError(404, "FILE_NOT_FOUND", "File not found in storage");
      }

      // Set response headers
      res.setHeader("Content-Type", metadata.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${metadata.originalName}"`
      );

      // Stream from local storage
      const fileStream = fs.createReadStream(metadata.storedPath);
      fileStream.pipe(res);
    } else {
      throw new AppError(500, "INVALID_STORAGE_TYPE", "Invalid storage type");
    }
  })
);

export default router;
