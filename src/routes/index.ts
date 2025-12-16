import { Express } from "express";
import uploadRouter from "./upload";
import downloadRouter from "./download";
import mergeRouter from "./merge";
import splitRouter from "./split";
import previewRouter from "./preview";
import compressRouter from "./compress";
import convertRouter from "./convert";
import editRouter from "./edit";
import pageNumbersRouter from "./pageNumbers";
import watermarkRouter from "./watermark";
import protectRouter from "./protect";
import unlockRouter from "./unlock";

export function setupRoutes(app: Express): void {
  // Upload routes
  app.use("/api", uploadRouter);

  // Download routes
  app.use("/api", downloadRouter);

  // Merge routes
  app.use("/api", mergeRouter);

  // Split routes
  app.use("/api", splitRouter);

  // Preview routes
  app.use("/api", previewRouter);

  // Compress routes
  app.use("/api", compressRouter);

  // Convert routes
  app.use("/api", convertRouter);

  // Edit routes
  app.use("/api", editRouter);

  // Page numbers routes
  app.use("/api", pageNumbersRouter);

  // Watermark routes
  app.use("/api", watermarkRouter);

  // Protect routes
  app.use("/api", protectRouter);

  // Unlock routes
  app.use("/api", unlockRouter);
}
