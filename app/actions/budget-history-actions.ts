"use server"

import { sql } from "@/lib/db"

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
    const tableExists = await sql`
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
    const records = await sql<
      {
        id: number
        budget_id: string
        expense_id: string
        amount: number
        recorded_at: string
        description: string | null
      }[]
    >`
      SELECT h.id, h.budget_id, h.expense_id, h.amount, h.recorded_at, e.description
      FROM budget_usage_history h
      LEFT JOIN expenses e ON h.expense_id = e.id
      WHERE h.budget_id = ${budgetId}
      ORDER BY h.recorded_at DESC
      LIMIT ${limit}
    `

    // Get the budget name
    const budgetResult = await sql<{ name: string }[]>`
      SELECT name FROM budgets WHERE id = ${budgetId}
    `
    const budgetName = budgetResult.length > 0 ? budgetResult[0].name : "Unknown Budget"

    // Format the records
    const formattedRecords: BudgetUsageRecord[] = records.map((record) => ({
      id: record.id,
      budgetId: record.budget_id,
      expenseId: record.expense_id,
      amount: Number(record.amount),
      recordedAt: new Date(record.recorded_at).toISOString(),
      expenseDescription: record.description || undefined,
      budgetName,
    }))

    // Group the data by time frame for chart visualization
    let groupedData: BudgetUsageChartData[] = []
    let dateFormat: string
    let groupByClause: string

    switch (timeFrame) {
      case "weekly":
        dateFormat = "YYYY-WW" // ISO week format
        groupByClause = "TO_CHAR(recorded_at, 'YYYY-IW')"
        break
      case "monthly":
        dateFormat = "YYYY-MM"
        groupByClause = "TO_CHAR(recorded_at, 'YYYY-MM')"
        break
      case "daily":
      default:
        dateFormat = "YYYY-MM-DD"
        groupByClause = "TO_CHAR(recorded_at, 'YYYY-MM-DD')"
        break
    }

    const groupedResult = await sql<
      {
        date_group: string
        total_amount: number
      }[]
    >`
      SELECT 
        ${groupByClause} as date_group,
        SUM(amount) as total_amount
      FROM budget_usage_history
      WHERE budget_id = ${budgetId}
      GROUP BY date_group
      ORDER BY date_group
    `

    // Calculate cumulative amounts
    let cumulativeAmount = 0
    groupedData = groupedResult.map((item) => {
      const amount = Number(item.total_amount)
      cumulativeAmount += amount
      return {
        date: item.date_group,
        amount,
        cumulativeAmount,
      }
    })

    // Get summary statistics
    const summaryResult = await sql<
      {
        total_records: number
        total_amount: number
        avg_amount: number
        max_amount: number
        min_amount: number
        first_date: string
        last_date: string
      }[]
    >`
      SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount,
        COALESCE(MAX(amount), 0) as max_amount,
        COALESCE(MIN(amount), 0) as min_amount,
        MIN(recorded_at) as first_date,
        MAX(recorded_at) as last_date
      FROM budget_usage_history
      WHERE budget_id = ${budgetId}
    `

    const summary: BudgetUsageSummary = {
      totalRecords: Number(summaryResult[0]?.total_records || 0),
      totalAmount: Number(summaryResult[0]?.total_amount || 0),
      averageAmount: Number(summaryResult[0]?.avg_amount || 0),
      maxAmount: Number(summaryResult[0]?.max_amount || 0),
      minAmount: Number(summaryResult[0]?.min_amount || 0),
      firstRecordDate: summaryResult[0]?.first_date
        ? new Date(summaryResult[0].first_date).toISOString()
        : new Date().toISOString(),
      lastRecordDate: summaryResult[0]?.last_date
        ? new Date(summaryResult[0].last_date).toISOString()
        : new Date().toISOString(),
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
    const tableExists = await sql`
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
    const records = await sql<
      {
        id: number
        budget_id: string
        budget_name: string
        expense_id: string
        expense_description: string | null
        amount: number
        recorded_at: string
      }[]
    >`
      SELECT 
        h.id, 
        h.budget_id, 
        b.name as budget_name,
        h.expense_id, 
        e.description as expense_description,
        h.amount, 
        h.recorded_at
      FROM budget_usage_history h
      JOIN budgets b ON h.budget_id = b.id
      LEFT JOIN expenses e ON h.expense_id = e.id
      ORDER BY h.recorded_at DESC
      LIMIT ${limit}
    `

    // Format the records
    const formattedRecords: BudgetUsageRecord[] = records.map((record) => ({
      id: record.id,
      budgetId: record.budget_id,
      budgetName: record.budget_name,
      expenseId: record.expense_id,
      expenseDescription: record.expense_description || undefined,
      amount: Number(record.amount),
      recordedAt: new Date(record.recorded_at).toISOString(),
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
