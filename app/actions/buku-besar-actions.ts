"use server"

import { prisma } from "@/lib/prisma"

// Define the expen se transaction type with budget information
export interface ExpenseTransaction {
  id: string
  date: string
  reference: string
  budgetId: string
  budgetName: string
  amount: number
  description: string
  submittedBy: string
  submittedAt: string
  notes?: string
}

// Define the expense summary type
export interface ExpenseSummary {
  totalExpenses: number
  currentMonthExpenses: number
  transactionCount: number
}

// Fetch all expenses with their associated budget information
export async function getExpensesWithBudget() {
  try {
    // Query to get all expenses with their budget information
    const expenses = await prisma.expense.findMany({
      include: {
        budget: true,
      },
      orderBy: [{ date: "desc" }, { submitted_at: "desc" }],
    })

    // Map the database results to our ExpenseTransaction interface
    const formattedExpenses: ExpenseTransaction[] = expenses.map((expense) => ({
      id: expense.id,
      date: expense.date.toLocaleDateString("id-ID"),
      reference: expense.id, // Using ID as reference
      budgetId: expense.budget_id,
      budgetName: expense.budget.name,
      amount: Number(expense.amount),
      description: expense.description,
      submittedBy: expense.submitted_by,
      submittedAt: expense.submitted_at.toLocaleString("id-ID"),
      notes: expense.notes || undefined,
    }))

    return {
      success: true,
      expenses: formattedExpenses,
    }
  } catch (error) {
    console.error("Error fetching expenses with budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get expense summary statistics
export async function getExpenseSummary() {
  try {
    // Get all expenses
    const expenses = await prisma.expense.findMany()

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Get current date information for filtering
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

    // Calculate current month expenses
    const currentMonthExpenses = expenses
      .filter((expense) => {
        const expenseDate = expense.date
        return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Count total transactions
    const transactionCount = expenses.length

    const summary: ExpenseSummary = {
      totalExpenses,
      currentMonthExpenses,
      transactionCount,
    }

    return {
      success: true,
      summary,
    }
  } catch (error) {
    console.error("Error fetching expense summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get expenses filtered by budget ID
export async function getExpensesByBudget(budgetId: string) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { budget_id: budgetId },
      include: {
        budget: true,
      },
      orderBy: [{ date: "desc" }, { submitted_at: "desc" }],
    })

    const formattedExpenses: ExpenseTransaction[] = expenses.map((expense) => ({
      id: expense.id,
      date: expense.date.toLocaleDateString("id-ID"),
      reference: expense.id, // Using ID as reference
      budgetId: expense.budget_id,
      budgetName: expense.budget.name,
      amount: Number(expense.amount),
      description: expense.description,
      submittedBy: expense.submitted_by,
      submittedAt: expense.submitted_at.toLocaleString("id-ID"),
      notes: expense.notes || undefined,
    }))

    return {
      success: true,
      expenses: formattedExpenses,
    }
  } catch (error) {
    console.error("Error fetching expenses by budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get all unique budgets that have expenses
export async function getBudgetsWithExpenses() {
  try {
    // Get all expenses with their budgets
    const expenses = await prisma.expense.findMany({
      include: {
        budget: true,
      },
      distinct: ["budget_id"],
    })

    // Extract unique budgets
    const budgets = expenses.map((expense) => ({
      id: expense.budget_id,
      name: expense.budget.name,
    }))

    // Sort by name
    budgets.sort((a, b) => a.name.localeCompare(b.name))

    return {
      success: true,
      budgets,
    }
  } catch (error) {
    console.error("Error fetching budgets with expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
