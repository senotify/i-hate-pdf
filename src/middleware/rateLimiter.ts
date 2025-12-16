import rateLimit from "express-rate-limit";

/**
 * Rate limiter middleware
 * Limits requests per IP address to prevent abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10) * 60 * 1000, // Convert minutes to milliseconds (default 15 min)
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || "50", 10), // Limit each IP to X requests per window (default 50)
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Too many requests from this IP, please try again after some time",
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoint
  skip: (req) => req.path === "/api/health",
});

/**
 * Stricter rate limiter for upload endpoints
 * Prevents abuse of file upload functionality
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per 15 minutes
  message: {
    error: {
      code: "UPLOAD_RATE_LIMIT_EXCEEDED",
      message: "Too many file uploads, please try again after 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
