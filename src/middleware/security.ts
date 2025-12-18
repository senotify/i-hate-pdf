import helmet from "helmet";
import cors from "cors";
import { CorsOptions } from "cors";

/**
 * Configure CORS options
 * In production, restrict to specific origins
 */
export function getCorsOptions(): CorsOptions {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, restrict to specific origins
  // In development, allow all origins for easier testing
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : isProduction
    ? ["https://i-hate-pdf-production.up.railway.app"]
    : true;

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

/**
 * Configure Helmet security headers
 */
export function getHelmetConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  return helmet({
    // Content Security Policy - enabled in both dev and production
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Tailwind
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
