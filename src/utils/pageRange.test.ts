import {
  parsePageRange,
  pageRangesToNumbers,
  isValidPageRange,
  PageRangeError,
} from "./pageRange";

describe("Page Range Parser", () => {
  describe("parsePageRange", () => {
    describe("valid inputs", () => {
      it("should parse a single page", () => {
        const result = parsePageRange("5", 10);
        expect(result).toEqual([{ start: 5, end: 5 }]);
      });

      it("should parse a simple range", () => {
        const result = parsePageRange("1-5", 10);
        expect(result).toEqual([{ start: 1, end: 5 }]);
      });

      it("should parse multiple individual pages", () => {
        const result = parsePageRange("1, 3, 5", 10);
        expect(result).toEqual([
          { start: 1, end: 1 },
          { start: 3, end: 3 },
          { start: 5, end: 5 },
        ]);
      });

      it("should parse mixed ranges and individual pages", () => {
        const result = parsePageRange("1-5, 8, 10-12", 15);
        expect(result).toEqual([
          { start: 1, end: 5 },
          { start: 8, end: 8 },
          { start: 10, end: 12 },
        ]);
      });

      it("should handle whitespace", () => {
        const result = parsePageRange(" 1 - 5 , 8 , 10 - 12 ", 15);
        expect(result).toEqual([
          { start: 1, end: 5 },
          { start: 8, end: 8 },
          { start: 10, end: 12 },
        ]);
      });

      it("should parse range at document boundaries", () => {
        const result = parsePageRange("1-10", 10);
        expect(result).toEqual([{ start: 1, end: 10 }]);
      });

      it("should parse single page at end of document", () => {
        const result = parsePageRange("10", 10);
        expect(result).toEqual([{ start: 10, end: 10 }]);
      });
    });

    describe("invalid syntax", () => {
      it("should reject empty string", () => {
        expect(() => parsePageRange("", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("", 10)).toThrow(
          "must be a non-empty string"
        );
      });

      it("should reject whitespace-only string", () => {
        expect(() => parsePageRange("   ", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("   ", 10)).toThrow("cannot be empty");
      });

      it("should reject non-numeric values", () => {
        expect(() => parsePageRange("abc", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("abc", 10)).toThrow(
          "Must be a valid number"
        );
      });

      it("should reject invalid range format", () => {
        expect(() => parsePageRange("1-5-10", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("1-5-10", 10)).toThrow(
          'Expected format: "start-end"'
        );
      });

      it("should reject range with missing start", () => {
        expect(() => parsePageRange("-5", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("-5", 10)).toThrow(
          "Start and end must be specified"
        );
      });

      it("should reject range with missing end", () => {
        expect(() => parsePageRange("5-", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("5-", 10)).toThrow(
          "Start and end must be specified"
        );
      });

      it("should reject empty comma-separated component", () => {
        expect(() => parsePageRange("1,,5", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("1,,5", 10)).toThrow(
          "empty range component"
        );
      });

      it("should reject trailing comma", () => {
        expect(() => parsePageRange("1,5,", 10)).toThrow(PageRangeError);
      });
    });

    describe("invalid bounds", () => {
      it("should reject reversed range (start > end)", () => {
        expect(() => parsePageRange("5-1", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("5-1", 10)).toThrow(
          "Start page (5) cannot be greater than end page (1)"
        );
      });

      it("should reject page number less than 1", () => {
        expect(() => parsePageRange("0", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("0", 10)).toThrow("must be at least 1");
      });

      it("should reject negative page number", () => {
        expect(() => parsePageRange("-1", 10)).toThrow(PageRangeError);
      });

      it("should reject page number exceeding total pages", () => {
        expect(() => parsePageRange("15", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("15", 10)).toThrow(
          "Exceeds total pages (10)"
        );
      });

      it("should reject range start less than 1", () => {
        expect(() => parsePageRange("0-5", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("0-5", 10)).toThrow("must be at least 1");
      });

      it("should reject range end exceeding total pages", () => {
        expect(() => parsePageRange("5-15", 10)).toThrow(PageRangeError);
        expect(() => parsePageRange("5-15", 10)).toThrow(
          "exceeds total pages (10)"
        );
      });
    });

    describe("edge cases", () => {
      it("should handle single-page document", () => {
        const result = parsePageRange("1", 1);
        expect(result).toEqual([{ start: 1, end: 1 }]);
      });

      it("should reject invalid page in single-page document", () => {
        expect(() => parsePageRange("2", 1)).toThrow(PageRangeError);
      });

      it("should handle range of same page", () => {
        const result = parsePageRange("5-5", 10);
        expect(result).toEqual([{ start: 5, end: 5 }]);
      });
    });
  });

  describe("pageRangesToNumbers", () => {
    it("should convert single page range to array", () => {
      const ranges = [{ start: 5, end: 5 }];
      const result = pageRangesToNumbers(ranges);
      expect(result).toEqual([5]);
    });

    it("should convert simple range to array", () => {
      const ranges = [{ start: 1, end: 5 }];
      const result = pageRangesToNumbers(ranges);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should convert multiple ranges to array", () => {
      const ranges = [
        { start: 1, end: 3 },
        { start: 5, end: 7 },
      ];
      const result = pageRangesToNumbers(ranges);
      expect(result).toEqual([1, 2, 3, 5, 6, 7]);
    });

    it("should handle empty array", () => {
      const result = pageRangesToNumbers([]);
      expect(result).toEqual([]);
    });
  });

  describe("isValidPageRange", () => {
    it("should return true for valid range", () => {
      expect(isValidPageRange("1-5", 10)).toBe(true);
      expect(isValidPageRange("1, 3, 5", 10)).toBe(true);
      expect(isValidPageRange("1-5, 8, 10-12", 15)).toBe(true);
    });

    it("should return false for invalid syntax", () => {
      expect(isValidPageRange("", 10)).toBe(false);
      expect(isValidPageRange("abc", 10)).toBe(false);
      expect(isValidPageRange("1-5-10", 10)).toBe(false);
    });

    it("should return false for invalid bounds", () => {
      expect(isValidPageRange("5-1", 10)).toBe(false);
      expect(isValidPageRange("0", 10)).toBe(false);
      expect(isValidPageRange("15", 10)).toBe(false);
    });
  });
});
