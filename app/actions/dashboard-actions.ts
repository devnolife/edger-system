"use server"

import { prisma } from "@/lib/prisma"

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
    const expenses = await prisma.expense.findMany()
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Get current date information
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear()

    // Get expenses from current month
    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = expense.date
      return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Get expenses from previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const previousMonthExpenses = expenses.filter((expense) => {
      const expenseDate = expense.date
      return expenseDate.getMonth() + 1 === previousMonth && expenseDate.getFullYear() === previousYear
    })

    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate expense growth percentage
    let expenseGrowth = 0
    if (previousMonthTotal > 0) {
      expenseGrowth = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    }

    // Get total number of budget items
    const totalBudgetItems = await prisma.budget.count()

    // Set default value for additional budget items since the table doesn't exist
    const totalAdditionalBudgetItems = await prisma.additionalAllocation.count()

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
    const expenses = await prisma.expense.findMany({
      orderBy: [{ date: "desc" }, { submitted_at: "desc" }],
      take: limit,
    })

    const transactions = expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      date: expense.date.toISOString().split("T")[0],
      amount: Number(expense.amount),
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
    // Get all expenses
    const expenses = await prisma.expense.findMany()

    // Get the last 6 months
    const today = new Date()
    const monthsData: { [key: string]: number } = {}

    for (let i = 0; i < 6; i++) {
      const date = new Date(today)
      date.setMonth(today.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      monthsData[monthKey] = 0
    }

    // Group expenses by month
    expenses.forEach((expense) => {
      const date = expense.date
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

      if (monthsData[monthKey] !== undefined) {
        monthsData[monthKey] += Number(expense.amount)
      }
    })

    // Format the data for the chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    const data = Object.entries(monthsData).map(([key, value]) => {
      const [year, month] = key.split("-").map(Number)
      return {
        name: monthNames[month - 1],
        pengeluaran: value,
      }
    })

    // Sort by month (assuming the keys are in format YYYY-MM)
    data.sort((a, b) => {
      const monthA = monthNames.indexOf(a.name)
      const monthB = monthNames.indexOf(b.name)
      return monthA - monthB
    })

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
