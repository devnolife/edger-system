"use server"

import { sql } from "@/lib/db"

// Define the expense transaction type with budget information
export interface ExpenseTransaction {
  id: string
  date: string
  reference: string
  budgetId: string
  budgetName: string
  amount: number
  description: string
  paymentMethod: string
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
    const expenses = await sql<
      {
        id: string
        budget_id: string
        budget_name: string
        description: string
        amount: number
        date: string
        submitted_by: string
        submitted_at: string
        notes: string | null
        reference: string | null
      }[]
    >`
  SELECT 
    e.id,
    e.budget_id,
    b.name as budget_name,
    e.description,
    e.amount,
    e.date,
    e.submitted_by,
    e.submitted_at,
    e.notes,
    e.id as reference
  FROM expenses e
  JOIN budgets b ON e.budget_id = b.id
  ORDER BY e.date DESC, e.submitted_at DESC
`

    // Map the database results to our ExpenseTransaction interface
    const formattedExpenses: ExpenseTransaction[] = expenses.map((expense) => ({
      id: expense.id,
      date: new Date(expense.date).toLocaleDateString("id-ID"),
      reference: expense.reference || expense.id,
      budgetId: expense.budget_id,
      budgetName: expense.budget_name,
      amount: Number(expense.amount),
      description: expense.description,
      paymentMethod: "Transfer Bank", // Default payment method since column doesn't exist
      submittedBy: expense.submitted_by,
      submittedAt: new Date(expense.submitted_at).toLocaleString("id-ID"),
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
    // Get current date information for filtering
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

    // Query to get summary statistics
    const summaryResult = await sql<
      {
        total_expenses: number
        current_month_expenses: number
        transaction_count: number
      }[]
    >`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(YEAR FROM date::date) = ${currentYear} 
          AND EXTRACT(MONTH FROM date::date) = ${currentMonth} 
          THEN amount ELSE 0 END), 0) as current_month_expenses,
        COUNT(*) as transaction_count
      FROM expenses
    `

    if (summaryResult.length === 0) {
      return {
        success: true,
        summary: {
          totalExpenses: 0,
          currentMonthExpenses: 0,
          transactionCount: 0,
        },
      }
    }

    const summary: ExpenseSummary = {
      totalExpenses: Number(summaryResult[0].total_expenses),
      currentMonthExpenses: Number(summaryResult[0].current_month_expenses),
      transactionCount: Number(summaryResult[0].transaction_count),
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
    const expenses = await sql<
      {
        id: string
        budget_id: string
        budget_name: string
        description: string
        amount: number
        date: string
        submitted_by: string
        submitted_at: string
        notes: string | null
        reference: string | null
      }[]
    >`
  SELECT 
    e.id,
    e.budget_id,
    b.name as budget_name,
    e.description,
    e.amount,
    e.date,
    e.submitted_by,
    e.submitted_at,
    e.notes,
    e.id as reference
  FROM expenses e
  JOIN budgets b ON e.budget_id = b.id
  WHERE e.budget_id = ${budgetId}
  ORDER BY e.date DESC, e.submitted_at DESC
`

    const formattedExpenses: ExpenseTransaction[] = expenses.map((expense) => ({
      id: expense.id,
      date: new Date(expense.date).toLocaleDateString("id-ID"),
      reference: expense.reference || expense.id,
      budgetId: expense.budget_id,
      budgetName: expense.budget_name,
      amount: Number(expense.amount),
      description: expense.description,
      paymentMethod: "Transfer Bank", // Default payment method
      submittedBy: expense.submitted_by,
      submittedAt: new Date(expense.submitted_at).toLocaleString("id-ID"),
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
    const budgets = await sql<
      {
        budget_id: string
        budget_name: string
      }[]
    >`
      SELECT DISTINCT
        e.budget_id,
        b.name as budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id
      ORDER BY b.name
    `

    return {
      success: true,
      budgets: budgets.map((budget) => ({
        id: budget.budget_id,
        name: budget.budget_name,
      })),
    }
  } catch (error) {
    console.error("Error fetching budgets with expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
