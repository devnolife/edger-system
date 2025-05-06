import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Simple query to test the connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({ connected: true })
  } catch (error) {
    console.error("Database connection error:", error)

    return NextResponse.json(
      {
        connected: false,
        message: "Database connection failed. Please check your environment variables.",
      },
      { status: 500 },
    )
  }
}
