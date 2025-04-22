import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Updates budget calculations in the database when an expense is created or updated
 * This ensures that budget values are always up-to-date
 */
export async function updateBudgetCalculations(budgetId: string, expenseAmount: number, isApproved = false) {
  try {
    // Update the budget's updated_at timestamp to trigger UI refreshes
    await sql`
      UPDATE budgets 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${budgetId}
    `

    // Revalidate the relevant paths
    revalidatePath(`/anggaran`)
    revalidatePath(`/pengeluaran`)

    return true
  } catch (error) {
    console.error("Error updating budget calculations:", error)
    return false
  }
}

/**
 * Tracks budget usage history for reporting and auditing
 * This function is a no-op if the budget_usage_history table doesn't exist
 */
export async function trackBudgetUsage(budgetId: string, expenseAmount: number, expenseId: string) {
  try {
    // Check if the table exists before trying to insert
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'budget_usage_history'
      ) as exists
    `

    // Only try to insert if the table exists
    if (tableExists[0]?.exists) {
      await sql`
        INSERT INTO budget_usage_history (
          budget_id, expense_id, amount, recorded_at
        ) VALUES (
          ${budgetId}, ${expenseId}, ${expenseAmount}, CURRENT_TIMESTAMP
        )
      `
    }
    return true
  } catch (error) {
    // Log the error but don't fail the operation
    console.error("Error tracking budget usage (non-critical):", error)
    return false
  }
}
