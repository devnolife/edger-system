import { NextResponse } from "next/server"
import * as Minio from "minio"

// Retrieve Environment Variables
const RAW_MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_BUCKET_ENV = process.env.MINIO_BUCKET; // Bucket to test, can be undefined here
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

// Validate Essential Environment Variables
if (!RAW_MINIO_ENDPOINT) {
  // This error will typically stop the application/route from loading if thrown at module level
  throw new Error("CRITICAL: MINIO_ENDPOINT environment variable is not set.");
}
if (!MINIO_ACCESS_KEY) {
  throw new Error("CRITICAL: MINIO_ACCESS_KEY environment variable is not set.");
}
if (!MINIO_SECRET_KEY) {
  throw new Error("CRITICAL: MINIO_SECRET_KEY environment variable is not set.");
}

// Parse Endpoint
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
    console.warn(`Warning: Invalid port format or value ('${endpointParts[1]}') in MINIO_ENDPOINT. Port will not be set.`);
    // PORT remains undefined, Minio client will use default (80 for http, 443 for https)
  }
}

// MinIO Client Options
const clientOptions: Minio.ClientOptions = {
  endPoint: HOSTNAME,
  useSSL: USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
};

if (PORT !== undefined) {
  clientOptions.port = PORT;
}

// Initialize MinIO Client
// Errors during client instantiation due to fundamentally incorrect options (not connection issues)
// would typically occur here and prevent the module from loading.
const minioClient = new Minio.Client(clientOptions);

// Simplified configuration details for the API response
const configurationReport = {
  rawMinioEndpointFromEnv: RAW_MINIO_ENDPOINT,
  bucketNameToTestViaEnv: MINIO_BUCKET_ENV || '(not set in environment)',
  effectiveClientOptions: {
    endPoint: HOSTNAME,
    port: PORT, // This is the parsed port, or undefined if default is used by Minio client
    useSSL: USE_SSL,
    // Access and Secret Keys are validated at startup. 
    // If we reach this point, they were provided.
    accessKeyConfigured: true,
    secretKeyConfigured: true,
  }
};

// --- End of Configuration ---

export async function GET() {
  // The MINIO_BUCKET_ENV is for the specific test operation of this GET request
  const bucketToTest = MINIO_BUCKET_ENV;

  try {
    if (!bucketToTest) {
      throw new Error('MINIO_BUCKET environment variable is not set. Cannot perform bucket existence test.');
    }

    const exists = await minioClient.bucketExists(bucketToTest);

    if (!exists) {
      throw new Error(`Bucket '${bucketToTest}' either does not exist or is not accessible with the provided credentials.`);
    }

    return NextResponse.json({
      status: "success",
      message: `Successfully connected to MinIO and verified bucket '${bucketToTest}' exists.`,
      details: {
        connectionVerified: true,
        bucketTested: bucketToTest,
        configurationUsed: configurationReport,
      }
    });
  } catch (error) {
    console.error("MinIO API Error in GET handler:", error);

    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'UnknownError',
      // Stack trace can be noisy and might expose sensitive info; consider omitting in production responses
      // stack: error instanceof Error ? error.stack : undefined 
    };

    return NextResponse.json(
      {
        status: "error",
        message: "Failed MinIO operation. See error details.",
        details: {
          connectionVerified: false, // Explicitly false on error path
          bucketTested: bucketToTest || '(not specified)',
          configurationUsed: configurationReport, // Show config even on error
          error: errorInfo,
        }
      },
      { status: 500 },
    );
  }
} 
