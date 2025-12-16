import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import pageNumbersRouter from "./pageNumbers";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory, ensureUploadDirectory } from "../utils/storage";

const app = express();
app.use(express.json());
app.use("/api", pageNumbersRouter);

describe("Page Numbers Endpoint", () => {
  let testFileId: string;
  let testFilePath: string;

  beforeAll(async () => {
    // Ensure upload directory exists
    ensureUploadDirectory();

    // Create a test PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Test Page 1", { x: 50, y: 350, size: 20, font });

    const page2 = pdfDoc.addPage([600, 400]);
    page2.drawText("Test Page 2", { x: 50, y: 350, size: 20, font });

    const pdfBytes = await pdfDoc.save();

    // Save to file system
    testFilePath = path.join(getUploadDirectory(), "test-page-numbers.pdf");
    fs.writeFileSync(testFilePath, pdfBytes);

    // Create metadata
    const metadata = createFileMetadata(
      "test-page-numbers.pdf",
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

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    // Clean up any generated files
    const uploadDir = getUploadDirectory();
    const files = fs.readdirSync(uploadDir);
    files.forEach((file) => {
      if (file.startsWith("page_numbers_")) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    });

    // Only delete this test's metadata entry
    metadataStorage.delete(testFileId);
  });

  it("should add page numbers to a PDF", async () => {
    const response = await request(app)
      .post("/api/page-numbers")
      .send({
        fileId: testFileId,
        options: {
          format: "Page {n} of {total}",
          position: "bottom-center",
          startNumber: 1,
          fontSize: 12,
          fontFamily: "Helvetica",
        },
      })
      .expect(200);

    expect(response.body).toHaveProperty("outputFileId");
    expect(response.body).toHaveProperty("downloadUrl");
    expect(response.body.downloadUrl).toContain("/api/download/");
  });

  it("should reject request with missing fileId", async () => {
    const response = await request(app)
      .post("/api/page-numbers")
      .send({
        options: {
          format: "Page {n}",
          position: "bottom-center",
        },
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with missing options", async () => {
    const response = await request(app)
      .post("/api/page-numbers")
      .send({
        fileId: testFileId,
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with invalid fileId", async () => {
    const response = await request(app)
      .post("/api/page-numbers")
      .send({
        fileId: "non-existent-id",
        options: {
          format: "Page {n}",
          position: "bottom-center",
        },
      })
      .expect(404);

    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });
});
