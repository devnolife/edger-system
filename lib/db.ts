import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Gunakan connection string dari environment variable atau fallback
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://postgres:postgres@localhost:5432/sikepro"

// Inisialisasi SQL client dengan konfigurasi
export const sql = neon(connectionString, {
  fetchOptions: {
    cache: "no-store",
  },
  retryOptions: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
  },
})

// Inisialisasi Drizzle ORM dengan schema
export const db = drizzle(sql, { schema })

// Helper function untuk format tanggal untuk SQL
export function formatDateForSQL(date: Date | string): string {
  if (typeof date === "string") {
    return date
  }
  return date.toISOString().split("T")[0]
}

// Helper function untuk generate ID unik
export function generateId(prefix: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}-${year}-${random}`
}

// Function untuk execute query dengan retry
export async function executeQueryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retryCount = 0
  let lastError: any = null

  while (retryCount < maxRetries) {
    try {
      return await queryFn()
    } catch (error) {
      lastError = error

      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("Too Many")) {
        console.log(`Rate limit hit, retrying (${retryCount + 1}/${maxRetries})...`)
        // Exponential backoff: wait longer between each retry
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        retryCount++
      } else {
        // If it's not a rate limit error, don't retry
        throw error
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError
}
