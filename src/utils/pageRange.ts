import { PageRange } from "../types";

/**
 * Error thrown when page range parsing fails
 */
export class PageRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageRangeError";
  }
}

/**
 * Parse a page range string into an array of PageRange objects
 *
 * Supports formats like:
 * - "1-5" -> single range
 * - "1, 3, 5" -> individual pages
 * - "1-5, 8, 10-12" -> mixed ranges and individual pages
 *
 * @param input - Page range string to parse
 * @param totalPages - Total number of pages in the document (for validation)
 * @returns Array of PageRange objects
 * @throws PageRangeError if syntax is invalid or ranges are out of bounds
 */
export function parsePageRange(input: string, totalPages: number): PageRange[] {
  // Validate input
  if (!input || typeof input !== "string") {
    throw new PageRangeError("Page range input must be a non-empty string");
  }

  if (totalPages < 1) {
    throw new PageRangeError("Total pages must be at least 1");
  }

  // Remove all whitespace
  const normalized = input.replace(/\s+/g, "");

  if (normalized.length === 0) {
    throw new PageRangeError("Page range cannot be empty");
  }

  // Split by comma
  const parts = normalized.split(",");
  const ranges: PageRange[] = [];

  for (const part of parts) {
    if (part.length === 0) {
      throw new PageRangeError("Invalid syntax: empty range component");
    }

    // Check if it's a range (contains hyphen)
    if (part.includes("-")) {
      const rangeParts = part.split("-");

      // Validate range format
      if (rangeParts.length !== 2) {
        throw new PageRangeError(
          `Invalid range syntax: "${part}". Expected format: "start-end"`
        );
      }

      if (rangeParts[0] === "" || rangeParts[1] === "") {
        throw new PageRangeError(
          `Invalid range syntax: "${part}". Start and end must be specified`
        );
      }

      // Parse start and end
      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      // Validate numbers
      if (isNaN(start) || isNaN(end)) {
        throw new PageRangeError(
          `Invalid range: "${part}". Start and end must be valid numbers`
        );
      }

      // Validate range logic
      if (start > end) {
        throw new PageRangeError(
          `Invalid range: "${part}". Start page (${start}) cannot be greater than end page (${end})`
        );
      }

      if (start < 1) {
        throw new PageRangeError(
          `Invalid range: "${part}". Start page must be at least 1`
        );
      }

      if (end > totalPages) {
        throw new PageRangeError(
          `Invalid range: "${part}". End page (${end}) exceeds total pages (${totalPages})`
        );
      }

      ranges.push({ start, end });
    } else {
      // Single page number
      const pageNum = parseInt(part, 10);

      if (isNaN(pageNum)) {
        throw new PageRangeError(
          `Invalid page number: "${part}". Must be a valid number`
        );
      }

      if (pageNum < 1) {
        throw new PageRangeError(
          `Invalid page number: ${pageNum}. Page numbers must be at least 1`
        );
      }

      if (pageNum > totalPages) {
        throw new PageRangeError(
          `Invalid page number: ${pageNum}. Exceeds total pages (${totalPages})`
        );
      }

      ranges.push({ start: pageNum, end: pageNum });
    }
  }

  return ranges;
}

/**
 * Convert PageRange array to a flat array of page numbers
 *
 * @param ranges - Array of PageRange objects
 * @returns Array of individual page numbers
 */
export function pageRangesToNumbers(ranges: PageRange[]): number[] {
  const pages: number[] = [];

  for (const range of ranges) {
    for (let i = range.start; i <= range.end; i++) {
      pages.push(i);
    }
  }

  return pages;
}

/**
 * Validate if a page range string is syntactically valid
 *
 * @param input - Page range string to validate
 * @param totalPages - Total number of pages in the document
 * @returns true if valid, false otherwise
 */
export function isValidPageRange(input: string, totalPages: number): boolean {
  try {
    parsePageRange(input, totalPages);
    return true;
  } catch (error) {
    return false;
  }
}
