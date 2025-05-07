"use server"

import * as Minio from "minio"

// Parse MinIO endpoint to extract hostname and port
const endpoint = process.env.MINIO_ENDPOINT || '';
const useSSL = endpoint.startsWith('https');

// Parse endpoint to get hostname and port correctly
let hostname = '';
let port: number | undefined = undefined;

if (endpoint) {
  // Remove protocol
  const withoutProtocol = endpoint.replace(/^https?:\/\//, '');

  // Split by colon to separate host and port
  const parts = withoutProtocol.split(':');
  hostname = parts[0];

  // Get port if specified
  if (parts.length > 1) {
    port = parseInt(parts[1], 10);
  }
}

// Client options
const clientOptions: Minio.ClientOptions = {
  endPoint: hostname,
  useSSL: useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
};

// Only set port if it's explicitly defined
if (port) {
  clientOptions.port = port;
}

// Initialize MinIO client
const minioClient = new Minio.Client(clientOptions);

/**
 * Uploads an image to MinIO storage
 * @param formData FormData containing the image file
 * @returns Object with success status and image URL or error message
 */
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    // Validate file
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    const fileType = file.type
    if (!fileType.startsWith("image/")) {
      return { success: false, error: "File must be an image" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" }
    }

    // Generate a unique object key for the receipt image
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const key = `receipts/${timestamp}-${randomString}-${file.name}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET || '',
      key,
      buffer,
      buffer.length,
      {
        'Content-Type': fileType
      }
    );

    // Generate public URL to the uploaded object
    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET || '',
      key,
      24 * 60 * 60 * 7 // URL valid for 7 days
    );

    return {
      success: true,
      url,
      key,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
