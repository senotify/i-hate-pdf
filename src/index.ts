import express from "express";
import cors from "cors";
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
app.use(cors(getCorsOptions())); // CORS configuration
app.use(express.json());

// Apply rate limiting to all API routes
app.use("/api", apiRateLimiter);

// Ensure upload directory exists
ensureUploadDirectory();

// Setup routes
setupRoutes(app);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start cleanup scheduler
startCleanupScheduler();

app.listen(PORT, () => {
  console.log(`PDF Toolkit backend running on port ${PORT}`);
});

export default app;
