import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../types";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 * Catches all errors and returns consistent error response format
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with stack trace
  console.error("Error occurred:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Determine status code and error details
  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let errorMessage = "An unexpected error occurred";
  let errorDetails: any = undefined;

  if (err instanceof AppError) {
    // Custom application error
    statusCode = err.statusCode;
    errorCode = err.code;
    errorMessage = err.message;
    errorDetails = err.details;
  } else if (err.name === "ValidationError") {
    // Validation errors
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    errorMessage = err.message;
  } else if (err.name === "UnauthorizedError") {
    // Authentication errors
    statusCode = 401;
    errorCode = "UNAUTHORIZED";
    errorMessage = "Authentication required";
  } else if (err.message.includes("ENOENT")) {
    // File not found errors
    statusCode = 404;
    errorCode = "FILE_NOT_FOUND";
    errorMessage = "The requested file was not found";
  } else if (err.message.includes("ENOSPC")) {
    // Disk space errors
    statusCode = 507;
    errorCode = "INSUFFICIENT_STORAGE";
    errorMessage = "Insufficient storage space";
  } else if (err.message.includes("ENOMEM")) {
    // Memory errors
    statusCode = 507;
    errorCode = "OUT_OF_MEMORY";
    errorMessage = "Insufficient memory to process request";
  } else {
    // Generic errors - include message in development
    if (process.env.NODE_ENV === "development") {
      errorMessage = err.message;
      errorDetails = err.stack;
    }
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
    },
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error: ErrorResponse = {
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  };
  res.status(404).json(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
