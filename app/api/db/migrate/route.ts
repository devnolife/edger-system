import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/migrate"

export async function POST() {
  try {
    const result = await runMigrations()

    if (result.success) {
      return NextResponse.json({ success: true, message: "Migrations completed successfully" })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Migration API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during migration",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST method to run migrations" }, { status: 405 })
}
