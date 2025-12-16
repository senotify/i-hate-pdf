import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import uploadRouter from "./upload";
import { ensureUploadDirectory, getUploadDirectory } from "../utils/storage";
import { metadataStorage } from "../utils/metadata";
import { errorHandler } from "../middleware/errorHandler";

// Create a test app
const app = express();
app.use(express.json());
app.use("/api", uploadRouter);
app.use(errorHandler);

// Helper function to create a test PDF
async function createTestPDF(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

describe("Upload Endpoint", () => {
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
    const files = fs.readdirSync(uploadDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(uploadDir, file));
    });
  });

  test("should upload a valid PDF file", async () => {
    const pdfBuffer = await createTestPDF();

    const response = await request(app)
      .post("/api/upload")
      .attach("file", pdfBuffer, "test.pdf")
      .expect(200);

    expect(response.body).toHaveProperty("fileId");
    expect(response.body).toHaveProperty("filename", "test.pdf");
    expect(response.body).toHaveProperty("size");
    expect(response.body.size).toBeGreaterThan(0);

    // Verify metadata was stored
    const metadata = metadataStorage.get(response.body.fileId);
    expect(metadata).toBeDefined();
    expect(metadata?.originalName).toBe("test.pdf");
  });

  test("should reject non-PDF files", async () => {
    const textBuffer = Buffer.from("This is not a PDF file");

    const response = await request(app)
      .post("/api/upload")
      .attach("file", textBuffer, "test.txt")
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("INVALID_FILE");
  });

  test("should reject request with no file", async () => {
    const response = await request(app).post("/api/upload").expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("NO_FILE");
  });
});
