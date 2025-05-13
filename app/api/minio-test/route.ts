import { NextResponse } from 'next/server';
import * as Minio from 'minio';

// Initialize MinIO Client with direct credentials
const minioClient = new Minio.Client({
  endPoint: "103.151.145.21",
  port: 990,
  useSSL: false,
  accessKey: "NfTGaBQHPnetL8lNZvrb",
  secretKey: "B2ypIasMJA3zD3ofbneA9Ov3brvF3m37cvz6KYsj",
});

// Default bucket name
const BUCKET_NAME = "edgersystem";

export async function GET() {
  try {
    // List all available buckets
    const buckets = await minioClient.listBuckets();

    // Check if our default bucket exists
    let defaultBucketExists = false;
    for (const bucket of buckets) {
      if (bucket.name === BUCKET_NAME) {
        defaultBucketExists = true;
        break;
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Successfully listed ${buckets.length} bucket(s)`,
      data: {
        buckets: buckets.map(bucket => ({
          name: bucket.name,
          creationDate: bucket.creationDate,
          isDefault: bucket.name === BUCKET_NAME
        })),
        defaultBucket: {
          name: BUCKET_NAME,
          exists: defaultBucketExists
        }
      }
    });
  } catch (error: unknown) {
    console.error("MinIO Error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to list MinIO buckets",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
