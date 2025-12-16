import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { cleanupExpiredFiles } from "./cleanup";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory } from "../utils/storage";

describe("Cleanup Service", () => {
  let expiredFilePath: string;
  let activeFilePath: string;
  let expiredFileId: string;
  let activeFileId: string;

  beforeEach(async () => {
    // Create test PDFs
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();

    // Create expired file
    expiredFilePath = path.join(getUploadDirectory(), "expired-file.pdf");
    fs.writeFileSync(expiredFilePath, pdfBytes);

    const expiredMetadata = createFileMetadata(
      "expired-file.pdf",
      expiredFilePath,
      "application/pdf",
      pdfBytes.length,
      false,
      undefined,
      "local"
    );
    // Set expiration to the past
    expiredMetadata.expiresAt = new Date(Date.now() - 1000);
    expiredFileId = expiredMetadata.fileId;
    metadataStorage.set(expiredFileId, expiredMetadata);

    // Create active file
    activeFilePath = path.join(getUploadDirectory(), "active-file.pdf");
    fs.writeFileSync(activeFilePath, pdfBytes);

    const activeMetadata = createFileMetadata(
      "active-file.pdf",
      activeFilePath,
      "application/pdf",
      pdfBytes.length,
      false,
      undefined,
      "local"
    );
    // Set expiration to the future
    activeMetadata.expiresAt = new Date(Date.now() + 60000);
    activeFileId = activeMetadata.fileId;
    metadataStorage.set(activeFileId, activeMetadata);
  });

  afterEach(() => {
    // Clean up any remaining files
    if (fs.existsSync(expiredFilePath)) {
      fs.unlinkSync(expiredFilePath);
    }
    if (fs.existsSync(activeFilePath)) {
      fs.unlinkSync(activeFilePath);
    }
    metadataStorage.delete(expiredFileId);
    metadataStorage.delete(activeFileId);
  });

  it("should delete expired files and keep active files", async () => {
    // Verify both files exist before cleanup
    expect(fs.existsSync(expiredFilePath)).toBe(true);
    expect(fs.existsSync(activeFilePath)).toBe(true);
    expect(metadataStorage.get(expiredFileId)).toBeDefined();
    expect(metadataStorage.get(activeFileId)).toBeDefined();

    // Run cleanup
    await cleanupExpiredFiles();

    // Verify expired file is deleted
    expect(fs.existsSync(expiredFilePath)).toBe(false);
    expect(metadataStorage.get(expiredFileId)).toBeUndefined();

    // Verify active file still exists
    expect(fs.existsSync(activeFilePath)).toBe(true);
    expect(metadataStorage.get(activeFileId)).toBeDefined();
  });

  it("should handle cleanup when no expired files exist", async () => {
    // Delete the expired file manually
    fs.unlinkSync(expiredFilePath);
    metadataStorage.delete(expiredFileId);

    // Run cleanup - should not throw error
    await expect(cleanupExpiredFiles()).resolves.not.toThrow();

    // Verify active file still exists
    expect(fs.existsSync(activeFilePath)).toBe(true);
    expect(metadataStorage.get(activeFileId)).toBeDefined();
  });

  it("should remove metadata even if file doesn't exist on disk", async () => {
    // Delete the expired file from disk but keep metadata
    fs.unlinkSync(expiredFilePath);

    // Verify metadata still exists
    expect(metadataStorage.get(expiredFileId)).toBeDefined();

    // Run cleanup
    await cleanupExpiredFiles();

    // Verify metadata is removed
    expect(metadataStorage.get(expiredFileId)).toBeUndefined();
  });
});
