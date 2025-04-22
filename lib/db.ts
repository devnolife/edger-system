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
