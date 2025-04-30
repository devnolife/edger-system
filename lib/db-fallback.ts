// Fallback mechanism for database operations
import { toast } from "@/hooks/use-toast"

export type DbResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<DbResult<T>> {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`)

    // Check if it's a connection error
    const errorString = String(error)
    if (errorString.includes("No database connection") || errorString.includes("connection")) {
      return {
        success: false,
        error: "Database connection failed. Please check your environment variables or contact support.",
      }
    }

    return { success: false, error: errorMessage }
  }
}

// Helper function to show database error toast
export function showDbErrorToast(error: string) {
  toast({
    title: "Database Error",
    description: error,
    variant: "destructive",
  })
}
