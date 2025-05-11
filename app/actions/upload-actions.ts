"use server"

import * as Minio from "minio"

// --- Retrieve Environment Variables ---
const RAW_MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_BUCKET = process.env.MINIO_BUCKET;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

// --- Validate Essential Environment Variables ---
if (!RAW_MINIO_ENDPOINT) {
  throw new Error("CRITICAL: MINIO_ENDPOINT environment variable is not set");
}
if (!MINIO_BUCKET) {
  throw new Error("CRITICAL: MINIO_BUCKET environment variable is not set");
}
if (!MINIO_ACCESS_KEY) {
  throw new Error("CRITICAL: MINIO_ACCESS_KEY environment variable is not set");
}
if (!MINIO_SECRET_KEY) {
  throw new Error("CRITICAL: MINIO_SECRET_KEY environment variable is not set");
}

// Since we've validated these variables above, we can safely assert they are non-null
const BUCKET_NAME = MINIO_BUCKET as string;

// --- Parse Endpoint ---
const USE_SSL = RAW_MINIO_ENDPOINT.startsWith('https');
const endpointWithoutProtocol = RAW_MINIO_ENDPOINT.replace(/^https?:\/\//, '');
const endpointParts = endpointWithoutProtocol.split(':');
const HOSTNAME = endpointParts[0];
let PORT: number | undefined = undefined;

if (endpointParts.length > 1) {
  const parsedPort = parseInt(endpointParts[1], 10);
  if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
    PORT = parsedPort;
  } else {
    console.warn(`Warning: Invalid port format ('${endpointParts[1]}') in MINIO_ENDPOINT. Using default port.`);
  }
}

// --- MinIO Client Options ---
const clientOptions: Minio.ClientOptions = {
  endPoint: HOSTNAME,
  useSSL: USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
};

if (PORT !== undefined) {
  clientOptions.port = PORT;
}

// --- Initialize MinIO Client ---
const minioClient = new Minio.Client(clientOptions);

// --- Verify Bucket Existence ---
async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      console.error(`CRITICAL: MinIO bucket "${BUCKET_NAME}" does not exist`);
      throw new Error(`Bucket "${BUCKET_NAME}" does not exist. Please create it first.`);
    }
    return true;
  } catch (error) {
    console.error("Error verifying bucket existence:", error);
    throw error;
  }
}

// Try to verify the bucket at startup to catch configuration issues early
ensureBucketExists().catch(err => {
  console.error("MinIO configuration error at startup:", err);
  // We don't throw here to allow the application to start even if MinIO is temporarily unavailable
});

/**
 * Uploads an image to MinIO storage
 * @param formData FormData containing the image file
 * @returns Object with success status and image URL or error message
 */
export async function uploadImage(formData: FormData) {
  console.log("Starting image upload process...");

  try {
    // Verify bucket exists before attempting upload
    await ensureBucketExists();

    const file = formData.get("file") as File;

    // Validate file existence
    if (!file) {
      console.error("Upload error: No file provided");
      return { success: false, error: "No file provided" };
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      console.error(`Upload error: Invalid file type: ${fileType}`);
      return { success: false, error: "File must be an image" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error(`Upload error: File too large: ${file.size} bytes`);
      return { success: false, error: "File size must be less than 5MB" };
    }

    // Generate a unique object key for the image
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const key = `receipts/${timestamp}-${randomString}-${file.name}`;
    console.log(`Generated object key: ${key}`);

    // Convert file to buffer
    console.log("Converting file to buffer...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Buffer created with size: ${buffer.length} bytes`);

    // Log upload attempt
    console.log(`Attempting to upload to MinIO bucket: ${BUCKET_NAME}`);
    console.log(`MinIO endpoint: ${HOSTNAME}, SSL: ${USE_SSL}, Port: ${PORT || "default"}`);

    // Upload to MinIO with detailed error capture
    try {
      console.log("Starting MinIO putObject operation...");
      await minioClient.putObject(
        BUCKET_NAME,
        key,
        buffer,
        buffer.length,
        {
          'Content-Type': fileType
        }
      );
      console.log("File successfully uploaded to MinIO");
    } catch (uploadError) {
      console.error("MinIO upload operation failed:", uploadError);
      throw uploadError; // Rethrow to be caught by outer try-catch
    }

    // Generate public URL
    console.log("Generating presigned URL...");
    let url;
    try {
      url = await minioClient.presignedGetObject(
        BUCKET_NAME,
        key,
        24 * 60 * 60 * 7 // URL valid for 7 days
      );
      console.log(`Presigned URL generated: ${url.substring(0, 50)}...`);
    } catch (urlError) {
      console.error("Failed to generate presigned URL:", urlError);
      // If URL generation fails but upload succeeded, return a partial success
      return {
        success: true,
        partialSuccess: true,
        key,
        error: "File uploaded but URL generation failed",
        details: urlError instanceof Error ? { name: urlError.name, message: urlError.message } : undefined
      };
    }

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    // Comprehensive error logging
    console.error("ERROR in uploadImage function:", error);

    // Specific handling for common MinIO errors
    if (error instanceof Error) {
      // Check for connection errors
      if (error.message.includes("ECONNREFUSED") || error.message.includes("connect ETIMEDOUT")) {
        console.error("MinIO connection error - server unreachable");
        return {
          success: false,
          error: "Unable to connect to storage server. Please check if the server is running.",
          errorType: "CONNECTION_ERROR"
        };
      }

      // Check for authentication errors
      if (error.message.includes("AccessDenied") || error.message.includes("InvalidAccessKeyId")) {
        console.error("MinIO authentication error - invalid credentials");
        return {
          success: false,
          error: "Storage authentication failed. Please check access credentials.",
          errorType: "AUTH_ERROR"
        };
      }

      // Check for permission errors
      if (error.message.includes("NoSuchBucket") || error.message.includes("AllAccessDisabled")) {
        console.error("MinIO bucket error or permission issue");
        return {
          success: false,
          error: "Storage bucket not found or access denied.",
          errorType: "BUCKET_ERROR"
        };
      }
    }

    // Enhanced error reporting
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during file upload",
      errorType: "UNKNOWN_ERROR",
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        // More controlled information for debugging
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };
  }
}
