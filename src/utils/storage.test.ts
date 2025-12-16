import { ensureUploadDirectory, getUploadDirectory } from "./storage";
import fs from "fs";

describe("Storage Utils", () => {
  test("ensureUploadDirectory creates directory if it doesn't exist", () => {
    ensureUploadDirectory();
    const uploadDir = getUploadDirectory();
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  test("getUploadDirectory returns valid path", () => {
    const uploadDir = getUploadDirectory();
    expect(uploadDir).toBeDefined();
    expect(typeof uploadDir).toBe("string");
    expect(uploadDir.length).toBeGreaterThan(0);
  });
});
