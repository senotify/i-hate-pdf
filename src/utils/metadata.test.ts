import {
  metadataStorage,
  generateFileId,
  calculateExpirationTime,
  createFileMetadata,
} from "./metadata";
import { FileMetadata } from "../types";

describe("Metadata Utilities", () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe("generateFileId", () => {
    it("should generate a valid UUID", () => {
      const fileId = generateFileId();
      expect(fileId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const id1 = generateFileId();
      const id2 = generateFileId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("calculateExpirationTime", () => {
    it("should calculate expiration time 60 minutes in the future by default", () => {
      const before = new Date();
      const expiresAt = calculateExpirationTime();
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 60 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it("should calculate expiration time with custom retention period", () => {
      const before = new Date();
      const expiresAt = calculateExpirationTime(30);
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 30 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 30 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });

  describe("createFileMetadata", () => {
    it("should create file metadata with all required fields", () => {
      const metadata = createFileMetadata(
        "test.pdf",
        "/tmp/test.pdf",
        "application/pdf",
        1024
      );

      expect(metadata.fileId).toBeDefined();
      expect(metadata.originalName).toBe("test.pdf");
      expect(metadata.storedPath).toBe("/tmp/test.pdf");
      expect(metadata.mimeType).toBe("application/pdf");
      expect(metadata.size).toBe(1024);
      expect(metadata.uploadedAt).toBeInstanceOf(Date);
      expect(metadata.expiresAt).toBeInstanceOf(Date);
      expect(metadata.isProcessed).toBe(false);
      expect(metadata.sourceFileIds).toBeUndefined();
    });

    it("should create processed file metadata with source file IDs", () => {
      const metadata = createFileMetadata(
        "merged.pdf",
        "/tmp/merged.pdf",
        "application/pdf",
        2048,
        true,
        ["id1", "id2"]
      );

      expect(metadata.isProcessed).toBe(true);
      expect(metadata.sourceFileIds).toEqual(["id1", "id2"]);
    });
  });

  describe("MetadataStorage", () => {
    it("should store and retrieve metadata", () => {
      const metadata = createFileMetadata(
        "test.pdf",
        "/tmp/test.pdf",
        "application/pdf",
        1024
      );

      metadataStorage.set(metadata.fileId, metadata);
      const retrieved = metadataStorage.get(metadata.fileId);

      expect(retrieved).toEqual(metadata);
    });

    it("should return undefined for non-existent file ID", () => {
      const retrieved = metadataStorage.get("non-existent-id");
      expect(retrieved).toBeUndefined();
    });

    it("should delete metadata", () => {
      const metadata = createFileMetadata(
        "test.pdf",
        "/tmp/test.pdf",
        "application/pdf",
        1024
      );

      metadataStorage.set(metadata.fileId, metadata);
      const deleted = metadataStorage.delete(metadata.fileId);
      const retrieved = metadataStorage.get(metadata.fileId);

      expect(deleted).toBe(true);
      expect(retrieved).toBeUndefined();
    });

    it("should return false when deleting non-existent metadata", () => {
      const deleted = metadataStorage.delete("non-existent-id");
      expect(deleted).toBe(false);
    });

    it("should get all metadata entries", () => {
      const metadata1 = createFileMetadata(
        "test1.pdf",
        "/tmp/test1.pdf",
        "application/pdf",
        1024
      );
      const metadata2 = createFileMetadata(
        "test2.pdf",
        "/tmp/test2.pdf",
        "application/pdf",
        2048
      );

      metadataStorage.set(metadata1.fileId, metadata1);
      metadataStorage.set(metadata2.fileId, metadata2);

      const all = metadataStorage.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(metadata1);
      expect(all).toContainEqual(metadata2);
    });

    it("should get expired files", () => {
      const expiredMetadata: FileMetadata = {
        fileId: "expired-id",
        originalName: "expired.pdf",
        storedPath: "/tmp/expired.pdf",
        mimeType: "application/pdf",
        size: 1024,
        uploadedAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isProcessed: false,
        storageType: "local",
      };

      const validMetadata = createFileMetadata(
        "valid.pdf",
        "/tmp/valid.pdf",
        "application/pdf",
        2048
      );

      metadataStorage.set(expiredMetadata.fileId, expiredMetadata);
      metadataStorage.set(validMetadata.fileId, validMetadata);

      const expired = metadataStorage.getExpired();
      expect(expired).toHaveLength(1);
      expect(expired[0].fileId).toBe("expired-id");
    });

    it("should clear all metadata", () => {
      const metadata1 = createFileMetadata(
        "test1.pdf",
        "/tmp/test1.pdf",
        "application/pdf",
        1024
      );
      const metadata2 = createFileMetadata(
        "test2.pdf",
        "/tmp/test2.pdf",
        "application/pdf",
        2048
      );

      metadataStorage.set(metadata1.fileId, metadata1);
      metadataStorage.set(metadata2.fileId, metadata2);

      metadataStorage.clear();

      const all = metadataStorage.getAll();
      expect(all).toHaveLength(0);
    });
  });
});
