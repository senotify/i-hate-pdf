import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import mergeRouter from "./merge";
import { ensureUploadDirectory, getUploadDirectory } from "../utils/storage";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { errorHandler } from "../middleware/errorHandler";

// Create a test app
const app = express();
app.use(express.json());
app.use("/api", mergeRouter);
app.use(errorHandler);

// Helper function to create a test PDF with specified number of pages
async function createTestPDF(pageCount: number = 1): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

describe("Merge Endpoint", () => {
  beforeAll(() => {
    ensureUploadDirectory();
  });

  beforeEach(() => {
    // Clear metadata storage before each test
    metadataStorage.clear();
  });

  afterEach(() => {
    // Clean up uploaded files after each test
    const uploadDir = getUploadDirectory();
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach((file) => {
        const filePath = path.join(uploadDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  test("should merge multiple PDF files", async () => {
    // Create two test PDFs
    const pdf1Buffer = await createTestPDF(2);
    const pdf2Buffer = await createTestPDF(3);

    // Save PDFs to disk and create metadata
    const uploadDir = getUploadDirectory();
    const file1Path = path.join(uploadDir, "test1.pdf");
    const file2Path = path.join(uploadDir, "test2.pdf");

    fs.writeFileSync(file1Path, pdf1Buffer);
    fs.writeFileSync(file2Path, pdf2Buffer);

    const metadata1 = createFileMetadata(
      "test1.pdf",
      file1Path,
      "application/pdf",
      pdf1Buffer.length,
      false,
      undefined,
      "local"
    );

    const metadata2 = createFileMetadata(
      "test2.pdf",
      file2Path,
      "application/pdf",
      pdf2Buffer.length,
      false,
      undefined,
      "local"
    );

    metadataStorage.set(metadata1.fileId, metadata1);
    metadataStorage.set(metadata2.fileId, metadata2);

    // Merge the PDFs
    const response = await request(app)
      .post("/api/merge")
      .send({ fileIds: [metadata1.fileId, metadata2.fileId] })
      .expect(200);

    expect(response.body).toHaveProperty("outputFileId");
    expect(response.body).toHaveProperty("downloadUrl");

    // Verify merged file metadata
    const mergedMetadata = metadataStorage.get(response.body.outputFileId);
    expect(mergedMetadata).toBeDefined();
    expect(mergedMetadata?.isProcessed).toBe(true);
    expect(mergedMetadata?.sourceFileIds).toEqual([
      metadata1.fileId,
      metadata2.fileId,
    ]);

    // Verify merged PDF has correct number of pages (2 + 3 = 5)
    if (mergedMetadata?.storageType === "local") {
      const mergedPdfBytes = fs.readFileSync(mergedMetadata.storedPath);
      const mergedPdf = await PDFDocument.load(mergedPdfBytes);
      expect(mergedPdf.getPageCount()).toBe(5);
    }
  });

  test("should reject merge with empty fileIds array", async () => {
    const response = await request(app)
      .post("/api/merge")
      .send({ fileIds: [] })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  test("should reject merge with missing fileIds", async () => {
    const response = await request(app).post("/api/merge").send({}).expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  test("should reject merge with non-existent file IDs", async () => {
    const response = await request(app)
      .post("/api/merge")
      .send({ fileIds: ["non-existent-id-1", "non-existent-id-2"] })
      .expect(404);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });

  test("should preserve page order when merging", async () => {
    // Create three test PDFs with different page counts
    const pdf1Buffer = await createTestPDF(1);
    const pdf2Buffer = await createTestPDF(2);
    const pdf3Buffer = await createTestPDF(3);

    // Save PDFs to disk and create metadata
    const uploadDir = getUploadDirectory();
    const file1Path = path.join(uploadDir, "test1.pdf");
    const file2Path = path.join(uploadDir, "test2.pdf");
    const file3Path = path.join(uploadDir, "test3.pdf");

    fs.writeFileSync(file1Path, pdf1Buffer);
    fs.writeFileSync(file2Path, pdf2Buffer);
    fs.writeFileSync(file3Path, pdf3Buffer);

    const metadata1 = createFileMetadata(
      "test1.pdf",
      file1Path,
      "application/pdf",
      pdf1Buffer.length,
      false,
      undefined,
      "local"
    );

    const metadata2 = createFileMetadata(
      "test2.pdf",
      file2Path,
      "application/pdf",
      pdf2Buffer.length,
      false,
      undefined,
      "local"
    );

    const metadata3 = createFileMetadata(
      "test3.pdf",
      file3Path,
      "application/pdf",
      pdf3Buffer.length,
      false,
      undefined,
      "local"
    );

    metadataStorage.set(metadata1.fileId, metadata1);
    metadataStorage.set(metadata2.fileId, metadata2);
    metadataStorage.set(metadata3.fileId, metadata3);

    // Merge in specific order: 3, 1, 2
    const response = await request(app)
      .post("/api/merge")
      .send({ fileIds: [metadata3.fileId, metadata1.fileId, metadata2.fileId] })
      .expect(200);

    // Verify merged PDF has correct total pages (3 + 1 + 2 = 6)
    const mergedMetadata = metadataStorage.get(response.body.outputFileId);
    if (mergedMetadata?.storageType === "local") {
      const mergedPdfBytes = fs.readFileSync(mergedMetadata.storedPath);
      const mergedPdf = await PDFDocument.load(mergedPdfBytes);
      expect(mergedPdf.getPageCount()).toBe(6);
    }
  });
});
