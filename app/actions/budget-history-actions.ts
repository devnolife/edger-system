"use server"

import { prisma } from "@/lib/prisma"

// Define types for budget history data
export interface BudgetUsageRecord {
  id: number
  budgetId: string
  expenseId: string
  amount: number
  recordedAt: string
  expenseDescription?: string
  budgetName?: string
}

export interface BudgetUsageChartData {
  date: string
  amount: number
  cumulativeAmount: number
}

export interface BudgetUsageSummary {
  totalRecords: number
  totalAmount: number
  averageAmount: number
  maxAmount: number
  minAmount: number
  firstRecordDate: string
  lastRecordDate: string
}

// Time frame options for grouping data
export type TimeFrame = "daily" | "weekly" | "monthly"

/**
 * Get budget usage history for a specific budget
 */
export async function getBudgetUsageHistory(budgetId: string, timeFrame: TimeFrame = "daily", limit = 100) {
  try {
    // Check if the table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'budget_usage_history'
      ) as exists
    `

    if (!tableExists[0]?.exists) {
      return {
        success: false,
        error: "Budget usage history tracking is not enabled",
      }
    }

    // Get the raw history records with expense descriptions
    const records = await prisma.budgetUsageHistory.findMany({
      where: { budgetId },
      include: {
        expense: true,
      },
      orderBy: {
        recordedAt: "desc",
      },
      take: limit,
    })

    // Get the budget name
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
    })

    const budgetName = budget?.name || "Unknown Budget"

    // Format the records
    const formattedRecords: BudgetUsageRecord[] = records.map((record) => ({
      id: record.id,
      budgetId: record.budgetId,
      expenseId: record.expenseId,
      amount: Number(record.amount),
      recordedAt: record.recordedAt.toISOString(),
      expenseDescription: record.expense.description || undefined,
      budgetName,
    }))

    // Group the data by time frame for chart visualization
    let groupedData: BudgetUsageChartData[] = []

    // For simplicity, we'll implement a basic grouping here
    // In a real implementation, you might want to use more sophisticated date grouping
    const groupedMap = new Map<string, number>()

    records.forEach((record) => {
      let dateKey: string
      const date = record.recordedAt

      switch (timeFrame) {
        case "weekly":
          // Get ISO week (simplified)
          const weekNumber = Math.ceil((date.getDate() + (date.getDay() === 0 ? 6 : date.getDay() - 1)) / 7)
          dateKey = `${date.getFullYear()}-${weekNumber.toString().padStart(2, "0")}`
          break
        case "monthly":
          dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
          break
        case "daily":
        default:
          dateKey = date.toISOString().split("T")[0]
          break
      }

      const currentAmount = groupedMap.get(dateKey) || 0
      groupedMap.set(dateKey, currentAmount + Number(record.amount))
    })

    // Convert the map to an array and sort by date
    const sortedDates = Array.from(groupedMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    // Calculate cumulative amounts
    let cumulativeAmount = 0
    groupedData = sortedDates.map(([date, amount]) => {
      cumulativeAmount += amount
      return {
        date,
        amount,
        cumulativeAmount,
      }
    })

    // Get summary statistics
    const amounts = records.map((record) => Number(record.amount))
    const totalRecords = records.length
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
    const averageAmount = totalRecords > 0 ? totalAmount / totalRecords : 0
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0
    const firstDate =
      records.length > 0 ? records[records.length - 1].recordedAt.toISOString() : new Date().toISOString()
    const lastDate = records.length > 0 ? records[0].recordedAt.toISOString() : new Date().toISOString()

    const summary: BudgetUsageSummary = {
      totalRecords,
      totalAmount,
      averageAmount,
      maxAmount,
      minAmount,
      firstRecordDate: firstDate,
      lastRecordDate: lastDate,
    }

    return {
      success: true,
      records: formattedRecords,
      chartData: groupedData,
      summary,
      budgetName,
    }
  } catch (error) {
    console.error("Error fetching budget usage history:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

/**
 * Get recent budget usage across all budgets
 */
export async function getRecentBudgetUsage(limit = 10) {
  try {
    // Check if the table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'budget_usage_history'
      ) as exists
    `

    if (!tableExists[0]?.exists) {
      return {
        success: false,
        error: "Budget usage history tracking is not enabled",
      }
    }

    // Get the recent usage records with budget and expense details
    const records = await prisma.budgetUsageHistory.findMany({
      include: {
        budget: true,
        expense: true,
      },
      orderBy: {
        recordedAt: "desc",
      },
      take: limit,
    })

    // Format the records
    const formattedRecords: BudgetUsageRecord[] = records.map((record) => ({
      id: record.id,
      budgetId: record.budgetId,
      budgetName: record.budget.name,
      expenseId: record.expenseId,
      expenseDescription: record.expense.description || undefined,
      amount: Number(record.amount),
      recordedAt: record.recordedAt.toISOString(),
    }))

    return {
      success: true,
      records: formattedRecords,
    }
  } catch (error) {
    console.error("Error fetching recent budget usage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
