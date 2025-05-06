import { migrate } from "drizzle-orm/neon-http/migrator"
import { db } from "./db"

// Fungsi untuk menjalankan migrasi
export async function runMigrations() {
  console.log("Running migrations...")

  try {
    await migrate(db, { migrationsFolder: "drizzle" })
    console.log("Migrations completed successfully")
    return { success: true }
  } catch (error) {
    console.error("Migration failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown migration error",
    }
  }
}

// Fungsi untuk memeriksa koneksi database
export async function checkDatabaseConnection() {
  try {
    // Coba query sederhana
    const result = await db.select().from(db.schema.budgets).limit(1)
    return { connected: true }
  } catch (error) {
    console.error("Database connection error:", error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}
