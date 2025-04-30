"use server"

import { sql, executeQueryWithRetry } from "@/lib/db"

// Dashboard summary data type
export interface DashboardSummary {
  totalExpenses: number
  expenseGrowth: number // percentage change from previous month
  totalBudgetItems: number
  totalAdditionalBudgetItems: number
}

// Recent transaction data type
export interface RecentTransaction {
  id: string
  description: string
  date: string
  amount: number
}

/**
 * Fetch dashboard summary data
 */
export async function getDashboardSummary(): Promise<{ success: boolean; data?: DashboardSummary; error?: string }> {
  try {
    // Get total expenses
    const totalExpensesResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses
      `,
    )
    const totalExpenses = Number(totalExpensesResult[0]?.total || 0)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get expenses from current month
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear()

    const currentMonthExpensesResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE EXTRACT(MONTH FROM date::date) = ${currentMonth}
        AND EXTRACT(YEAR FROM date::date) = ${currentYear}
      `,
    )
    const currentMonthExpenses = Number(currentMonthExpensesResult[0]?.total || 0)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get expenses from previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const previousMonthExpensesResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE EXTRACT(MONTH FROM date::date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date::date) = ${previousYear}
      `,
    )
    const previousMonthExpenses = Number(previousMonthExpensesResult[0]?.total || 0)

    // Calculate expense growth percentage
    let expenseGrowth = 0
    if (previousMonthExpenses > 0) {
      expenseGrowth = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    }

    // Get total number of budget items
    const totalBudgetItemsResult = await executeQueryWithRetry(
      () => sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM budgets
      `,
    )
    const totalBudgetItems = Number(totalBudgetItemsResult[0]?.count || 0)

    // Set default value for additional budget items since the table doesn't exist
    const totalAdditionalBudgetItems = 0

    return {
      success: true,
      data: {
        totalExpenses,
        expenseGrowth,
        totalBudgetItems,
        totalAdditionalBudgetItems,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Fetch recent transactions for the dashboard
 */
export async function getRecentTransactions(limit = 5): Promise<{
  success: boolean
  transactions?: RecentTransaction[]
  error?: string
}> {
  try {
    // Get recent expenses
    const recentTransactionsResult = await executeQueryWithRetry(
      () => sql<
        {
          id: string
          description: string
          date: string
          amount: number
        }[]
      >`
        SELECT id, description, date, amount
        FROM expenses
        ORDER BY date DESC, submitted_at DESC
        LIMIT ${limit}
      `,
    )

    const transactions = recentTransactionsResult.map((tx) => ({
      id: tx.id,
      description: tx.description,
      date: tx.date,
      amount: Number(tx.amount),
    }))

    return {
      success: true,
      transactions,
    }
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get monthly expense data for the financial summary chart
 */
export async function getMonthlyExpenseData(): Promise<{
  success: boolean
  data?: { name: string; pengeluaran: number }[]
  error?: string
}> {
  try {
    // Get the last 6 months of expense data
    const monthlyDataResult = await executeQueryWithRetry(
      () => sql<{ month: string; year: number; total: number }[]>`
        SELECT 
          EXTRACT(MONTH FROM date::date) as month,
          EXTRACT(YEAR FROM date::date) as year,
          COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE date::date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM date::date), EXTRACT(YEAR FROM date::date)
        ORDER BY year, month
        LIMIT 6
      `,
    )

    // Format the data for the chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    const data = monthlyDataResult.map((item) => ({
      name: monthNames[Number(item.month) - 1],
      pengeluaran: Number(item.total),
    }))

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error fetching monthly expense data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
