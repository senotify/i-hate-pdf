import { isCloudinaryConfigured } from "./cloudinaryStorage";

describe("Cloudinary Storage", () => {
  describe("isCloudinaryConfigured", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment before each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it("should return false when no credentials are set", () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      expect(isCloudinaryConfigured()).toBe(false);
    });

    it("should return false when only cloud name is set", () => {
      process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      expect(isCloudinaryConfigured()).toBe(false);
    });

    it("should return false when only API key is set", () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      process.env.CLOUDINARY_API_KEY = "test-key";
      delete process.env.CLOUDINARY_API_SECRET;

      expect(isCloudinaryConfigured()).toBe(false);
    });

    it("should return false when only API secret is set", () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      process.env.CLOUDINARY_API_SECRET = "test-secret";

      expect(isCloudinaryConfigured()).toBe(false);
    });

    it("should return false when only two credentials are set", () => {
      process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.CLOUDINARY_API_KEY = "test-key";
      delete process.env.CLOUDINARY_API_SECRET;

      expect(isCloudinaryConfigured()).toBe(false);
    });

    it("should return true when all credentials are set", () => {
      process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
      process.env.CLOUDINARY_API_KEY = "test-key";
      process.env.CLOUDINARY_API_SECRET = "test-secret";

      expect(isCloudinaryConfigured()).toBe(true);
    });
  });
});
