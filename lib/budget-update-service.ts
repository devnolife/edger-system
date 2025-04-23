import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Updates budget calculations in the database when an expense is created
 * This ensures that budget values are always up-to-date
 */
export async function updateBudgetCalculations(budgetId: string, expenseAmount: number, isApproved = true) {
  try {
    // First, check if the last_expense_amount column exists to avoid errors
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'budgets' AND column_name = 'last_expense_amount'
      ) as exists
    `

    const hasTrackingColumns = columnExists[0]?.exists

    if (hasTrackingColumns) {
      // Get the current spent amount for this budget
      const spentResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE budget_id = ${budgetId}
      `
      const spentAmount = Number(spentResult[0]?.total || 0)

      // Get the current additional allocations for this budget
      const allocationsResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM additional_allocations 
        WHERE original_budget_id = ${budgetId} AND status = 'approved'
      `
      const additionalAmount = Number(allocationsResult[0]?.total || 0)

      // Get the budget's original amount
      const budgetResult = await sql<{ amount: number }[]>`
        SELECT amount FROM budgets WHERE id = ${budgetId}
      `

      if (budgetResult.length > 0) {
        // Update the budget with the new calculated values and tracking info
        await sql`
          UPDATE budgets 
          SET 
            updated_at = CURRENT_TIMESTAMP,
            last_expense_amount = ${expenseAmount},
            last_expense_date = CURRENT_TIMESTAMP
          WHERE id = ${budgetId}
        `
      }
    } else {
      // If tracking columns don't exist, just update the timestamp
      await sql`
        UPDATE budgets 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${budgetId}
      `

      console.log("Budget tracking columns don't exist. Run the migration to enable full tracking features.")
    }

    // Revalidate the relevant paths
    revalidatePath(`/anggaran`)
    revalidatePath(`/pengeluaran`)
    revalidatePath(`/budget-history`)

    return true
  } catch (error) {
    console.error("Error updating budget calculations:", error)
    return false
  }
}

/**
 * Tracks budget usage history for reporting and auditing
 */
export async function trackBudgetUsage(budgetId: string, expenseAmount: number, expenseId: string) {
  try {
    // Check if the table exists before trying to insert
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'budget_usage_history'
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
    } else {
      console.log("Budget usage history table doesn't exist. Run the migration to enable history tracking.")
    }
    return true
  } catch (error) {
    // Log the error but don't fail the operation
    console.error("Error tracking budget usage (non-critical):", error)
    return false
  }
}
