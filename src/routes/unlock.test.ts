// Mock node-qpdf2 before any imports
const mockDecrypt = jest.fn();
jest.mock("node-qpdf2", () => ({
  decrypt: mockDecrypt,
}));

import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import unlockRouter from "./unlock";
import { metadataStorage } from "../utils/metadata";
import { ensureUploadDirectory, getUploadDirectory } from "../utils/storage";

const app = express();
app.use(express.json());
app.use("/api", unlockRouter);

describe("POST /api/unlock", () => {
  beforeAll(() => {
    ensureUploadDirectory();
  });

  it("should unlock a password-protected PDF with correct password", async () => {
    // Mock successful decryption
    mockDecrypt.mockImplementation(async (options: any) => {
      // Create a dummy unlocked file
      fs.writeFileSync(options.output, Buffer.from("unlocked-pdf-content"));
    });

    // Create a simple test PDF (simulating protected file)
    const protectedFilePath = path.join(
      getUploadDirectory(),
      "test-protected.pdf"
    );
    fs.writeFileSync(protectedFilePath, Buffer.from("protected-pdf-content"));

    // Create metadata for protected file
    const testFileId = "test-protected-id";
    metadataStorage.set(testFileId, {
      fileId: testFileId,
      originalName: "test-protected.pdf",
      storedPath: protectedFilePath,
      mimeType: "application/pdf",
      size: fs.statSync(protectedFilePath).size,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      isProcessed: false,
      storageType: "local",
    });

    // Unlock the PDF
    const response = await request(app).post("/api/unlock").send({
      fileId: testFileId,
      password: "test123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("outputFileId");
    expect(response.body).toHaveProperty("downloadUrl");

    // Clean up
    fs.unlinkSync(protectedFilePath);
    const outputMetadata = metadataStorage.get(response.body.outputFileId);
    if (outputMetadata && fs.existsSync(outputMetadata.storedPath)) {
      fs.unlinkSync(outputMetadata.storedPath);
    }
  });

  it("should reject unlock with incorrect password", async () => {
    // Mock failed decryption (wrong password)
    mockDecrypt.mockRejectedValue(new Error("Incorrect password"));

    // Create a simple test PDF (simulating protected file)
    const protectedFilePath = path.join(
      getUploadDirectory(),
      "test-protected-wrong.pdf"
    );
    fs.writeFileSync(protectedFilePath, Buffer.from("protected-pdf-content"));

    // Create metadata for protected file
    const testFileId = "test-protected-wrong-id";
    metadataStorage.set(testFileId, {
      fileId: testFileId,
      originalName: "test-protected-wrong.pdf",
      storedPath: protectedFilePath,
      mimeType: "application/pdf",
      size: fs.statSync(protectedFilePath).size,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      isProcessed: false,
      storageType: "local",
    });

    // Try to unlock with wrong password
    const response = await request(app).post("/api/unlock").send({
      fileId: testFileId,
      password: "wrong123",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INCORRECT_PASSWORD");

    // Clean up
    fs.unlinkSync(protectedFilePath);
  });

  it("should reject request with missing fileId", async () => {
    const response = await request(app).post("/api/unlock").send({
      password: "test123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with missing password", async () => {
    const response = await request(app).post("/api/unlock").send({
      fileId: "test-file-id",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });
});
