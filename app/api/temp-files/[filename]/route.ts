import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { headers } from "next/headers";

// Path to temporary files - MUST match the path in the upload-actions.ts file
const TEMP_UPLOAD_DIR = process.env.TEMP_UPLOAD_DIR || join(process.cwd(), "tmp", "uploads");

/**
 * API Route to serve temporary uploaded files for preview
 */
export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Basic security check - prevent path traversal attacks
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json(
      { error: "Invalid filename" },
      { status: 400 }
    );
  }

  // Full path to the temp file
  const filePath = join(TEMP_UPLOAD_DIR, filename);

  // Check if file exists
  try {
    if (!existsSync(filePath)) {
      console.error(`Temp file not found: ${filePath}`);
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get file stats
    const fileStats = await stat(filePath);

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream'; // Default fallback

    // Set content type based on common image extensions
    if (extension === 'jpg' || extension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === 'png') {
      contentType = 'image/png';
    } else if (extension === 'gif') {
      contentType = 'image/gif';
    } else if (extension === 'webp') {
      contentType = 'image/webp';
    } else if (extension === 'svg') {
      contentType = 'image/svg+xml';
    }

    // Return the file with appropriate headers
    const headersList = new Headers();
    headersList.set('Content-Type', contentType);
    headersList.set('Content-Length', fileStats.size.toString());
    headersList.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    // Create array buffer from file buffer for Response
    const arrayBuffer = new Uint8Array(fileBuffer).buffer;

    return new Response(arrayBuffer, {
      status: 200,
      headers: headersList
    });

  } catch (error) {
    console.error("Error serving temp file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
