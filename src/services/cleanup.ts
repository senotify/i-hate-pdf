import cron from "node-cron";
import fs from "fs";
import { metadataStorage } from "../utils/metadata";
import { deleteFromCloudinary } from "../utils/cloudinaryStorage";

/**
 * Clean up expired files from storage
 */
export async function cleanupExpiredFiles(): Promise<void> {
  const expiredFiles = metadataStorage.getExpired();

  console.log(`Found ${expiredFiles.length} expired files to clean up`);

  for (const file of expiredFiles) {
    try {
      if (file.storageType === "cloudinary" && file.cloudinaryPublicId) {
        // Delete from Cloudinary
        await deleteFromCloudinary(file.cloudinaryPublicId);
        console.log(`Deleted file from Cloudinary: ${file.cloudinaryPublicId}`);
      } else if (file.storageType === "local") {
        // Delete from local storage
        if (fs.existsSync(file.storedPath)) {
          fs.unlinkSync(file.storedPath);
          console.log(`Deleted local file: ${file.storedPath}`);
        }
      }

      // Remove metadata
      metadataStorage.delete(file.fileId);
    } catch (error) {
      console.error(
        `Failed to delete file ${file.fileId}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

export function startCleanupScheduler(): void {
  // Run cleanup every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running cleanup scheduler...");
    await cleanupExpiredFiles();
  });

  console.log("Cleanup scheduler started (runs every 5 minutes)");
}
