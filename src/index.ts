import express from "express";
import cors from "cors";
import path from "path";
import { setupRoutes } from "./routes";
import { startCleanupScheduler } from "./services/cleanup";
import { ensureUploadDirectory } from "./utils/storage";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimiter";
import {
  getCorsOptions,
  getHelmetConfig,
  enforceHttps,
} from "./middleware/security";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(enforceHttps); // Enforce HTTPS in production
app.use(getHelmetConfig()); // Security headers
app.use(express.json());

// Apply CORS and rate limiting ONLY to API routes
app.use("/api", cors(getCorsOptions()));
app.use("/api", apiRateLimiter);

// Ensure upload directory exists
ensureUploadDirectory();

// Setup routes
setupRoutes(app);

// Health check endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health/live", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/ready", (req, res) => {
  res.json({ status: "ready", timestamp: new Date().toISOString() });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  console.log(`Serving frontend from: ${frontendPath}`);

  // Check if frontend directory exists
  const fs = require("fs");
  if (fs.existsSync(frontendPath)) {
    console.log("✓ Frontend directory found");
    console.log("Frontend files:", fs.readdirSync(frontendPath));
  } else {
    console.error("✗ Frontend directory not found at:", frontendPath);
  }

  app.use(express.static(frontendPath));

  // Serve index.html for all non-API routes (SPA support)
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return notFoundHandler(req, res, next);
    }

    const indexPath = path.join(frontendPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error("✗ index.html not found at:", indexPath);
      res
        .status(404)
        .send("Frontend not found. Please check build configuration.");
    }
  });
} else {
  // 404 handler for undefined routes in development
  app.use(notFoundHandler);
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Start cleanup scheduler
startCleanupScheduler();

app.listen(PORT, () => {
  console.log(`IHatePDF backend running on port ${PORT}`);
});

export default app;
