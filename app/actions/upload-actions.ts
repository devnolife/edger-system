"use server"

import * as Minio from "minio"
import { writeFile, mkdir, unlink, readFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { existsSync } from "fs"
import * as mime from 'mime-types'

// --- Retrieve Environment Variables ---
const RAW_MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_BUCKET = process.env.MINIO_BUCKET || "edgersystem"; // Set default bucket name
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_PORT = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 990;
const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR || join(process.cwd(), "tmp", "uploads");

// --- Validate Essential Environment Variables ---
if (!RAW_MINIO_ENDPOINT) {
  throw new Error("CRITICAL: MINIO_ENDPOINT environment variable is not set");
}
if (!MINIO_ACCESS_KEY) {
  throw new Error("CRITICAL: MINIO_ACCESS_KEY environment variable is not set");
}
if (!MINIO_SECRET_KEY) {
  throw new Error("CRITICAL: MINIO_SECRET_KEY environment variable is not set");
}

// Since we've validated these variables above, we can safely assert they are non-null
const BUCKET_NAME = MINIO_BUCKET;

// --- MinIO Client Options ---
const clientOptions: Minio.ClientOptions = {
  endPoint: process.env.MINIO_ENDPOINT || "103.151.145.21",
  port: MINIO_PORT,
  useSSL: false, // or true if you are using SSL
  accessKey: process.env.MINIO_ACCESS_KEY || "NfTGaBQHPnetL8lNZvrb",
  secretKey: process.env.MINIO_SECRET_KEY || "B2ypIasMJA3zD3ofbneA9Ov3brvF3m37cvz6KYsj"
};

// --- Initialize MinIO Client ---
const minioClient = new Minio.Client(clientOptions);

// --- Verify Bucket Existence ---
async function ensureBucketExists() {
  try {
    console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      console.log(`Bucket "${BUCKET_NAME}" does not exist. Attempting to create it...`);
      try {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        console.log(`Successfully created bucket "${BUCKET_NAME}"`);
        return true;
      } catch (createError) {
        console.error(`Failed to create bucket "${BUCKET_NAME}":`, createError);
        throw createError;
      }
    }
    console.log(`Bucket "${BUCKET_NAME}" exists and is accessible.`);
    return true;
  } catch (error) {
    console.error(`Error verifying bucket "${BUCKET_NAME}" existence:`, error);
    throw error;
  }
}

// Try to verify the bucket at startup to catch configuration issues early
ensureBucketExists().catch(err => {
  console.error("MinIO configuration error at startup:", err);
  // We don't throw here to allow the application to start even if MinIO is temporarily unavailable
});

/**
 * Create a temporary directory for file uploads if it doesn't exist
 */
async function ensureTempDirExists() {
  if (!existsSync(TEMP_UPLOAD_DIR)) {
    try {
      await mkdir(TEMP_UPLOAD_DIR, { recursive: true });
      console.log(`Created temporary upload directory: ${TEMP_UPLOAD_DIR}`);
    } catch (error) {
      console.error("Failed to create temporary upload directory:", error);
      throw error;
    }
  }
}

/**
 * Process the uploaded file and store it temporarily
 * @param formData FormData containing the image file
 * @returns Object with success status and temporary file path or error message
 */
export async function processUploadedFile(formData: FormData) {
  console.log("Starting file processing...");

  try {
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

    // Ensure temporary directory exists
    await ensureTempDirExists();

    // Generate a unique filename for temporary storage
    const tempId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const tempFilename = `${tempId}-${Date.now()}.${fileExt}`;
    const tempFilePath = join(TEMP_UPLOAD_DIR, tempFilename);

    // Store file metadata for later use
    const fileMetadata = {
      originalName: file.name,
      tempFilePath,
      tempFilename,
      fileType,
      fileSize: file.size,
      tempId,
      timestamp: Date.now()
    };

    // Convert file to buffer and write to temporary location
    console.log(`Saving file to temporary location: ${tempFilePath}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);

    console.log("File successfully stored in temporary location");

    return {
      success: true,
      tempFile: fileMetadata,
      previewUrl: `/api/temp-files/${tempFilename}` // Endpoint to serve temporary files for preview
    };
  } catch (error) {
    console.error("Error processing uploaded file:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during file processing",
      errorType: "PROCESSING_ERROR",
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };
  }
}

/**
 * Upload a previously processed file to MinIO storage
 * @param tempFileData Data from the temporarily stored file
 * @returns Object with success status and object name or error message
 */
export async function finalizeUpload(tempFileData: any) {
  console.log("Starting MinIO upload for file:", tempFileData?.tempFilename);

  try {
    // Verify bucket exists before attempting upload
    await ensureBucketExists();

    if (!tempFileData || !tempFileData.tempFilePath) {
      console.error("Upload error: Invalid temporary file data");
      return { success: false, error: "No valid file data provided" };
    }

    // Generate a unique object key for the image in MinIO
    const uniqueFileName = uuidv4();
    const mimeType = mime.lookup(tempFileData.originalName) || 'application/octet-stream';
    const fileExtension = mime.extension(mimeType) || '';

    console.log(`Generated MinIO object key: ${uniqueFileName}`);

    // Read the file from temporary storage
    try {
      console.log("Starting MinIO putObject operation...");
      await minioClient.putObject(
        BUCKET_NAME,
        uniqueFileName,
        await readFile(tempFileData.tempFilePath),
        undefined, // size parameter is optional
        {
          'Content-Type': mimeType,
          'X-Amz-Meta-Original-Filename': tempFileData.originalName,
          'X-Amz-Meta-File-Extension': fileExtension,
          'X-Amz-Meta-File-Size': tempFileData.fileSize.toString(),
          'X-Amz-Meta-Uploaded-By': 'Edger System',
        }
      );
      console.log("File successfully uploaded to MinIO");

      // After successful upload to MinIO, delete the temporary file
      try {
        await unlink(tempFileData.tempFilePath);
        console.log(`Temporary file deleted: ${tempFileData.tempFilePath}`);
      } catch (deleteError) {
        // Log the error but don't fail the operation if temp file deletion fails
        console.error("Warning: Failed to delete temporary file:", deleteError);
        // We continue the operation even if temp file deletion fails
      }
    } catch (uploadError) {
      console.error("MinIO upload operation failed:", uploadError);
      throw uploadError;
    }

    // Return the object name instead of generating a presigned URL
    return {
      success: true,
      objectName: uniqueFileName, // Return object name instead of URL
      bucketName: BUCKET_NAME,
      metadata: {
        originalName: tempFileData.originalName,
        mimeType,
        fileSize: tempFileData.fileSize,
        fileExtension
      }
    };
  } catch (error) {
    // Comprehensive error logging
    console.error("ERROR in finalizeUpload function:", error);

    // Specific handling for common MinIO errors
    if (error instanceof Error) {
      // Check for connection errors
      if (error.message.includes("ECONNREFUSED") || error.message.includes("connect ETIMEDOUT")) {
        console.error("MinIO connection error - server unreachable");
        return {
          success: false,
          error: "Tidak dapat terhubung ke server penyimpanan. Mohon periksa apakah server berjalan.",
          errorType: "CONNECTION_ERROR"
        };
      }

      // Check for authentication errors
      if (error.message.includes("AccessDenied") || error.message.includes("InvalidAccessKeyId")) {
        console.error("MinIO authentication error - invalid credentials");
        return {
          success: false,
          error: "Autentikasi penyimpanan gagal. Mohon periksa kredensial akses.",
          errorType: "AUTH_ERROR"
        };
      }

      // Check for permission errors
      if (error.message.includes("NoSuchBucket") || error.message.includes("AllAccessDisabled")) {
        console.error("MinIO bucket error or permission issue");
        return {
          success: false,
          error: "Bucket penyimpanan tidak ditemukan atau akses ditolak.",
          errorType: "BUCKET_ERROR"
        };
      }

      // Check for file size errors
      if (error.message.includes("EntityTooLarge")) {
        console.error("MinIO file size error");
        return {
          success: false,
          error: "Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.",
          errorType: "FILE_SIZE_ERROR"
        };
      }

      // Check for file type errors
      if (error.message.includes("InvalidFileType")) {
        console.error("MinIO file type error");
        return {
          success: false,
          error: "Tipe file tidak didukung. Hanya file gambar (JPG, PNG, GIF) yang diperbolehkan.",
          errorType: "FILE_TYPE_ERROR"
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
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };
  }
}

/**
 * Retrieve a file from MinIO storage
 * @param bucketName The bucket where the file is stored
 * @param objectName The object name (file identifier) in MinIO
 * @returns Object with file stream, statistics, and download file name
 */
export async function getFile(bucketName: string, objectName: string) {
  try {
    const stat = await minioClient.statObject(bucketName, objectName);
    // Get metadata
    const originalFileName = stat.metaData['original-filename'] || objectName;
    const fileExtension = stat.metaData['file-extension'] || '';
    const downloadFileName = originalFileName.includes('.')
      ? originalFileName
      : `${originalFileName}.${fileExtension}`;

    // Get file stream
    const fileStream = await minioClient.getObject(bucketName, objectName);

    return {
      fileStream,
      stat,
      downloadFileName
    };
  } catch (error: any) {
    console.error("Error retrieving file from MinIO:", error);
    throw new Error(`Failed to get file: ${error.message}`);
  }
}

/**
 * Generate a presigned URL for a file in MinIO
 * @param bucketName The bucket where the file is stored
 * @param objectName The object name (file identifier) in MinIO
 * @param expirySeconds How long the URL should be valid (in seconds)
 * @returns The presigned URL for accessing the file
 */
export async function getPresignedUrl(bucketName: string, objectName: string, expirySeconds = 24 * 60 * 60) {
  try {
    const url = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expirySeconds
    );
    return url;
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Legacy function for direct upload to MinIO (keeping for backward compatibility)
 * @deprecated Use processUploadedFile() followed by finalizeUpload() instead
 */
export async function uploadImage(formData: FormData) {
  console.log("DEPRECATED: Using direct uploadImage function. Consider switching to the two-step process.");

  try {
    // Process the file first
    const processResult = await processUploadedFile(formData);

    if (!processResult.success) {
      return processResult; // Return the error from processing
    }

    // NOTE: We no longer immediately upload to MinIO
    // Instead we recommend processing the file first with processUploadedFile()
    // Then when the form is submitted, call finalizeUpload() with the temp file data

    // For backward compatibility, we still provide this function
    // but recommend the two-step approach for better error handling and UX
    const uploadResult = await finalizeUpload(processResult.tempFile);

    return uploadResult;
  } catch (error) {
    console.error("ERROR in uploadImage function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during file upload",
      errorType: "UNKNOWN_ERROR",
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };
  }
}
