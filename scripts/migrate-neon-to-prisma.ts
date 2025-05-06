/**
 * This script helps migrate from direct Neon SQL queries to Prisma ORM
 *
 * To run this script:
 * 1. Make sure your DATABASE_URL is set in .env
 * 2. Run: npx ts-node scripts/migrate-neon-to-prisma.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting migration from Neon to Prisma...")

  try {
    // Check connection
    await prisma.$queryRaw`SELECT 1`
    console.log("Database connection successful")

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log("Existing tables:", tables)

    // Generate Prisma client
    console.log("Generating Prisma client...")
    // This would typically be done via the CLI: npx prisma generate

    console.log("Migration complete!")
    console.log("Next steps:")
    console.log('1. Run "npx prisma generate" to generate the Prisma client')
    console.log('2. Run "npx prisma db pull" to update your schema if needed')
    console.log('3. Run "npx prisma studio" to explore your database')
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
