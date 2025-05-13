import { NextResponse } from "next/server";
import { getFile, getPresignedUrl } from "@/app/actions/upload-actions";
import { headers } from "next/headers";

// Get MinIO bucket name from environment variable or use default
const MINIO_BUCKET = process.env.MINIO_BUCKET || "edgersystem";

/**
 * API Route to serve images from MinIO storage
 */
export async function GET(
  request: Request,
  { params }: { params: { objectName: string } }
) {
  const { objectName } = params;

  // Basic security check - prevent path traversal attacks
  if (!objectName || objectName.includes('..') || objectName.includes('/') || objectName.includes('\\')) {
    return NextResponse.json(
      { error: "Invalid object name" },
      { status: 400 }
    );
  }

  try {
    // Get the file from MinIO
    const { fileStream, stat, downloadFileName } = await getFile(MINIO_BUCKET, objectName);

    // Create a new response with the file stream
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
    responseHeaders.set('Content-Disposition', `inline; filename="${downloadFileName}"`);
    responseHeaders.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    // Convert the file stream to response
    const chunks: Uint8Array[] = [];

    // Process the stream
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }

    // Combine all chunks
    const allChunks = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );

    let offset = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, offset);
      offset += chunk.length;
    }

    return new Response(allChunks, {
      status: 200,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error("Error serving image from MinIO:", error);

    // For fallback, try to redirect to a presigned URL
    try {
      const presignedUrl = await getPresignedUrl(MINIO_BUCKET, objectName, 60 * 60); // Valid for 1 hour
      return NextResponse.redirect(presignedUrl);
    } catch (presignedError) {
      console.error("Failed to generate presigned URL as fallback:", presignedError);
      return NextResponse.json(
        { error: "Failed to serve image" },
        { status: 500 }
      );
    }
  }
} 
