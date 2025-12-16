import helmet from "helmet";
import cors from "cors";
import { CorsOptions } from "cors";

/**
 * Configure CORS options
 * In production, restrict to specific origins
 */
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      // In production, check against allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

/**
 * Configure Helmet security headers
 */
export function getHelmetConfig() {
  // In production, relax CSP for serving the built frontend
  const isProduction = process.env.NODE_ENV === "production";

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: isProduction
      ? false
      : {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
    // Strict Transport Security (HTTPS)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent clickjacking
    frameguard: {
      action: "deny",
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // XSS Protection
    xssFilter: true,
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Referrer Policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  });
}

/**
 * Middleware to enforce HTTPS in production
 */
export function enforceHttps(req: any, res: any, next: any) {
  // Skip in development
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  // Check if request is secure
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    return next();
  }

  // Redirect to HTTPS
  res.redirect(301, `https://${req.headers.host}${req.url}`);
}
