import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import watermarkRouter from "./watermark";
import { metadataStorage, createFileMetadata } from "../utils/metadata";
import { getUploadDirectory, ensureUploadDirectory } from "../utils/storage";

const app = express();
app.use(express.json());
app.use("/api", watermarkRouter);

describe("Watermark Endpoint", () => {
  let testFileId: string;
  let testFilePath: string;

  beforeAll(async () => {
    // Ensure upload directory exists
    ensureUploadDirectory();

    // Create a test PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Test Page", { x: 50, y: 350, size: 20, font });

    const pdfBytes = await pdfDoc.save();

    // Save to file system
    testFilePath = path.join(getUploadDirectory(), "test-watermark.pdf");
    fs.writeFileSync(testFilePath, pdfBytes);

    // Create metadata
    const metadata = createFileMetadata(
      "test-watermark.pdf",
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
      if (file.startsWith("watermarked_")) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    });

    // Only delete this test's metadata entry
    metadataStorage.delete(testFileId);
  });

  it("should add watermark to a PDF", async () => {
    const response = await request(app)
      .post("/api/watermark")
      .send({
        fileId: testFileId,
        options: {
          text: "CONFIDENTIAL",
          fontSize: 48,
          opacity: 0.5,
          rotation: 45,
          position: "center",
          color: "#808080",
        },
      })
      .expect(200);

    expect(response.body).toHaveProperty("outputFileId");
    expect(response.body).toHaveProperty("downloadUrl");
    expect(response.body.downloadUrl).toContain("/api/download/");
  });

  it("should reject request with missing fileId", async () => {
    const response = await request(app)
      .post("/api/watermark")
      .send({
        options: {
          text: "WATERMARK",
          position: "center",
        },
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with missing text", async () => {
    const response = await request(app)
      .post("/api/watermark")
      .send({
        fileId: testFileId,
        options: {
          position: "center",
        },
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with invalid opacity", async () => {
    const response = await request(app)
      .post("/api/watermark")
      .send({
        fileId: testFileId,
        options: {
          text: "WATERMARK",
          opacity: 1.5,
          position: "center",
        },
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });

  it("should reject request with invalid fileId", async () => {
    const response = await request(app)
      .post("/api/watermark")
      .send({
        fileId: "non-existent-id",
        options: {
          text: "WATERMARK",
          position: "center",
        },
      })
      .expect(404);

    expect(response.body.error.code).toBe("FILE_NOT_FOUND");
  });
});
