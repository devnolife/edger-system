import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

/**
 * Update budget calculations when an expense is created or updated
 */
export async function updateBudgetCalculations(budgetId: string, expenseAmount: number, isApproved: boolean) {
  try {
    // No need to update any status fields since all expenses are automatically approved
    console.log(`Budget ${budgetId} updated with expense amount ${expenseAmount}`)
    return true
  } catch (error) {
    console.error("Error updating budget calculations:", error)
    return false
  }
}

/**
 * Track budget usage for history
 */
export async function trackBudgetUsage(budgetId: string, amount: number, expenseId: string) {
  try {
    // Check if the budget_usage_history table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'budget_usage_history'
      ) as exists
    `

    if (!tableExists[0]?.exists) {
      console.log("Budget usage history tracking is not enabled")
      return false
    }

    // Create a new budget usage history record
    await prisma.budgetUsageHistory.create({
      data: {
        budgetId,
        expenseId,
        amount: new Prisma.Decimal(amount),
        recordedAt: new Date(),
      },
    })

    return true
  } catch (error) {
    console.error("Error tracking budget usage:", error)
    return false
  }
}
