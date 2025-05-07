import { NextResponse } from "next/server"
import * as Minio from "minio"

// Show the configuration being used (without exposing secret key)
const minioConfig = {
  rawEndpoint: process.env.MINIO_ENDPOINT || 'not set',
  useSSL: process.env.MINIO_ENDPOINT?.startsWith('https') || false,
  region: process.env.MINIO_REGION || 'us-east-1',
  bucket: process.env.MINIO_BUCKET || 'not set',
  hasAccessKey: !!process.env.MINIO_ACCESS_KEY,
  hasSecretKey: !!process.env.MINIO_SECRET_KEY
}

// Parse endpoint to get hostname and port
let hostname = '';
let port: number | undefined = undefined; // Default to undefined instead of 9000

if (minioConfig.rawEndpoint) {
  // Remove protocol
  const withoutProtocol = minioConfig.rawEndpoint.replace(/^https?:\/\//, '');

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
  useSSL: minioConfig.useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
};

// Only set port if it's explicitly defined
if (port) {
  clientOptions.port = port;
}

// Initialize MinIO client
const minioClient = new Minio.Client(clientOptions);

export async function GET() {
  try {
    // If bucket name not specified, we can't test
    if (!process.env.MINIO_BUCKET) {
      throw new Error('MINIO_BUCKET environment variable is not set');
    }

    // Verify access to the configured bucket
    const exists = await minioClient.bucketExists(process.env.MINIO_BUCKET)

    if (!exists) {
      throw new Error(`Bucket ${process.env.MINIO_BUCKET} does not exist`)
    }

    return NextResponse.json({
      connected: true,
      config: {
        ...minioConfig,
        hostname,
        port,
        clientOptions
      }
    })
  } catch (error) {
    console.error("MinIO connection error:", error)

    // Get detailed error information
    const errorDetail = error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : error;

    return NextResponse.json(
      {
        connected: false,
        config: {
          ...minioConfig,
          hostname,
          port,
          clientOptions
        },
        error: errorDetail
      },
      { status: 500 },
    )
  }
} 
