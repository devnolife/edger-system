import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Initialize the SQL client with the DATABASE_URL environment variable
// Add connection pooling configuration
export const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    cache: "no-store",
  },
  // Add exponential backoff for retries
  retryOptions: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
  },
})

// Initialize the Drizzle ORM instance
export const db = drizzle(sql)

// Helper function to format date for SQL
export function formatDateForSQL(date: Date | string): string {
  if (typeof date === "string") {
    return date
  }
  return date.toISOString().split("T")[0]
}

// Helper function to generate unique IDs
export function generateId(prefix: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}-${year}-${random}`
}

// Add this function to your existing db.ts file
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
