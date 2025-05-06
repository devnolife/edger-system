import type { Config } from "drizzle-kit"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Get database URL from environment variables
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required")
}

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config
