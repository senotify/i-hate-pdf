import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
}

/**
 * Upload a file to Cloudinary
 * @param filePath - Local file path to upload
 * @param folder - Cloudinary folder (default: pdf-toolkit)
 * @returns Upload result with public ID and URLs
 */
export async function uploadToCloudinary(
  filePath: string,
  folder: string = "pdf-toolkit"
): Promise<CloudinaryUploadResult> {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: "raw", // For non-image files like PDFs
        use_filename: false,
        unique_filename: true,
      }
    );

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload to Cloudinary: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Upload a buffer to Cloudinary
 * @param buffer - File buffer to upload
 * @param filename - Original filename
 * @param folder - Cloudinary folder (default: pdf-toolkit)
 * @returns Upload result with public ID and URLs
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "pdf-toolkit"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(
            new Error(`Failed to upload buffer to Cloudinary: ${error.message}`)
          );
        } else if (result) {
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Download a file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns File buffer
 */
export async function downloadFromCloudinary(
  publicId: string
): Promise<Buffer> {
  try {
    const url = cloudinary.url(publicId, {
      resource_type: "raw",
      secure: true,
    });

    // Fetch the file from Cloudinary
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(
      `Failed to download from Cloudinary: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Deletion result
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
    return result;
  } catch (error) {
    throw new Error(
      `Failed to delete from Cloudinary: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Delete multiple files from Cloudinary
 * @param publicIds - Array of Cloudinary public IDs
 * @returns Deletion results
 */
export async function deleteMultipleFromCloudinary(
  publicIds: string[]
): Promise<{ deleted: Record<string, string> }> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: "raw",
    });
    return result;
  } catch (error) {
    throw new Error(
      `Failed to delete multiple files from Cloudinary: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check if Cloudinary is configured
 * @returns true if all required environment variables are set
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
