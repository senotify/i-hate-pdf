import helmet from "helmet";
import cors from "cors";
import { CorsOptions } from "cors";

/**
 * Configure CORS options
 * In production, restrict to specific origins
 */
export function getCorsOptions(): CorsOptions {
  // In production with same-origin deployment, allow all origins
  // The frontend is served from the same domain, so CORS is not an issue
  return {
    origin: true, // Allow all origins
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
