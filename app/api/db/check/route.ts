import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/migrate"

export async function GET() {
  try {
    const result = await checkDatabaseConnection()

    if (result.connected) {
      return NextResponse.json({ connected: true })
    } else {
      return NextResponse.json({ connected: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Database check API error:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error checking database",
      },
      { status: 500 },
    )
  }
}
