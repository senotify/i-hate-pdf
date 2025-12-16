import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import downloadRouter from "./download";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory, ensureUploadDirectory } from "../utils/storage";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api", downloadRouter);
app.use(errorHandler);

describe("Download Endpoint", () => {
  let testFilePath: string;
  let testFileId: string;

  beforeEach(async () => {
    // Ensure upload directory exists
    ensureUploadDirectory();

    // Create a test PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();
    const pdfBytes = await pdfDoc.save();

    // Save to uploads directory
    testFilePath = path.join(getUploadDirectory(), "test-download.pdf");
    fs.writeFileSync(testFilePath, pdfBytes);

    // Create metadata
    const metadata = createFileMetadata(
      "test-download.pdf",
      testFilePath,
      "application/pdf",
      pdfBytes.length,
      false,
      undefined,
      "local"
    );
    testFileId = metadata.fileId;
    metadataStorage.set(testFileId, metadata);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    metadataStorage.delete(testFileId);
  });

  it("should download a file with correct headers", async () => {
    const response = await request(app)
      .get(`/api/download/${testFileId}`)
      .expect(200);

    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.headers["content-disposition"]).toContain(
      "attachment; filename="
    );
    expect(response.headers["content-disposition"]).toContain(
      "test-download.pdf"
    );
  });

  it("should return 404 for non-existent file", async () => {
    const response = await request(app)
      .get("/api/download/non-existent-id")
      .expect(404);

    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });

  it("should return 404 when file exists in metadata but not on disk", async () => {
    // Delete the file but keep metadata
    fs.unlinkSync(testFilePath);

    const response = await request(app)
      .get(`/api/download/${testFileId}`)
      .expect(404);

    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });
});
