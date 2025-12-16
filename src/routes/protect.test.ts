import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import protectRouter from "./protect";
import uploadRouter from "./upload";
import { metadataStorage } from "../utils/metadata";
import { ensureUploadDirectory, getUploadDirectory } from "../utils/storage";

// Mock node-qpdf2
jest.mock("node-qpdf2", () => ({
  encrypt: jest.fn().mockImplementation(async (options: any) => {
    // Create a dummy encrypted file
    fs.writeFileSync(options.output, Buffer.from("encrypted-pdf-content"));
  }),
}));

const app = express();
app.use(express.json());
app.use("/api", uploadRouter);
app.use("/api", protectRouter);
// Note: errorHandler not needed here as protect route handles errors internally

describe("POST /api/protect", () => {
  beforeAll(() => {
    ensureUploadDirectory();
  });

  it("should protect a PDF with password", async () => {
    // Create a simple test PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();

    // Save test PDF to temp file
    const testFilePath = path.join(getUploadDirectory(), "test.pdf");
    fs.writeFileSync(testFilePath, pdfBytes);

    // Create metadata for test file
    const testFileId = "test-file-id";
    metadataStorage.set(testFileId, {
      fileId: testFileId,
      originalName: "test.pdf",
      storedPath: testFilePath,
      mimeType: "application/pdf",
      size: pdfBytes.length,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      isProcessed: false,
      storageType: "local",
    });

    // Protect the PDF
    const response = await request(app)
      .post("/api/protect")
      .send({
        fileId: testFileId,
        password: "test123",
        permissions: {
          printing: true,
          modifying: false,
          copying: false,
          annotating: false,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("outputFileId");
    expect(response.body).toHaveProperty("downloadUrl");

    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    const outputMetadata = metadataStorage.get(response.body.outputFileId);
    if (outputMetadata && fs.existsSync(outputMetadata.storedPath)) {
      fs.unlinkSync(outputMetadata.storedPath);
    }
  });

  it("should reject request with missing fileId", async () => {
    const response = await request(app).post("/api/protect").send({
      password: "test123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with missing password", async () => {
    const response = await request(app).post("/api/protect").send({
      fileId: "test-file-id",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });
});
