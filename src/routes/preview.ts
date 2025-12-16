import { Router, Request, Response } from "express";
import { metadataStorage } from "../utils/metadata";
import { generatePagePreviews } from "../utils/preview";
import { ErrorResponse } from "../types";

const router = Router();

/**
 * GET /api/preview/:fileId
 * Get page previews for a PDF file
 */
router.get("/preview/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

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

    // Generate page previews
    const previews = await generatePagePreviews(
      metadata.storedPath,
      metadata.storageType,
      metadata.cloudinaryPublicId
    );

    // Return previews
    res.status(200).json({
      fileId,
      pageCount: previews.length,
      previews,
    });
  } catch (error) {
    console.error("Preview generation error:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "PREVIEW_ERROR",
        message: "An error occurred while generating previews",
        details: error instanceof Error ? error.message : String(error),
      },
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
