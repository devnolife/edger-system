"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getBudgetById } from "./budget-actions"
// Add this import at the top of the file
import { updateBudgetCalculations, trackBudgetUsage } from "@/lib/budget-update-service"

// Remove this line:
// export type ExpenseStatus = "pending" | "approved" | "rejected"

// Update the Expense interface to remove the status field:
export interface Expense {
  id: string
  budgetId: string
  description: string
  amount: number
  date: string
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  additionalAllocationId?: string
}

// Updated validation schema without status field
const expenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  submittedBy: z.string().min(1, "Submitter is required"),
  notes: z.string().optional(),
})

// Refactored createExpense function to directly update budget calculations
export async function createExpense(formData: FormData) {
  try {
    // Extract and validate data
    const budgetId = formData.get("budgetId") as string
    const description = formData.get("description") as string
    const amountStr = formData.get("amount") as string
    // Ensure we're properly parsing the amount, which might be a formatted string
    const amount =
      typeof amountStr === "string" && amountStr.includes(",")
        ? Number.parseFloat(amountStr.replace(/[^\d.-]/g, ""))
        : Number.parseFloat(amountStr)
    const date = formData.get("date") as string
    const submittedBy = formData.get("submittedBy") as string
    const notes = (formData.get("notes") as string) || ""

    // Validate data
    const validatedData = expenseSchema.parse({
      budgetId,
      description,
      amount,
      date,
      submittedBy,
      notes,
    })

    // Generate a unique ID
    const id = generateId("EXP")

    // Get the current budget details to check available amount
    const budgetResult = await getBudgetById(validatedData.budgetId)
    if (!budgetResult.success) {
      return { success: false, error: budgetResult.error || "Failed to fetch budget details" }
    }

    const budget = budgetResult.budget
    const availableAmount = Number(budget.availableAmount)

    let additionalAllocationId: string | null = null
    let needsAllocation = false

    // Check if the expense exceeds the available budget
    if (validatedData.amount > availableAmount) {
      needsAllocation = true
      const shortageAmount = validatedData.amount - availableAmount

      // Create an additional allocation that is automatically approved
      additionalAllocationId = generateId("ADD")

      await sql`
        INSERT INTO additional_allocations (
          id, original_budget_id, description, reason, amount, 
          request_date, status, requested_by, related_expense_id,
          approved_by, approved_at
        ) VALUES (
          ${additionalAllocationId}, 
          ${validatedData.budgetId}, 
          ${"Alokasi tambahan untuk: " + validatedData.description}, 
          ${"Pengeluaran melebihi anggaran yang tersedia"}, 
          ${shortageAmount}, 
          ${formatDateForSQL(validatedData.date)}, 
          'approved', 
          ${validatedData.submittedBy},
          ${id},
          ${validatedData.submittedBy},
          CURRENT_TIMESTAMP
        )
      `
    }

    // Insert the expense record - without status field
    await sql`
      INSERT INTO expenses (
        id, budget_id, description, amount, date, 
        submitted_by, notes, additional_allocation_id
      ) VALUES (
        ${id}, 
        ${validatedData.budgetId}, 
        ${validatedData.description}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.date)}, 
        ${validatedData.submittedBy}, 
        ${validatedData.notes},
        ${additionalAllocationId}
      )
    `

    // Update budget calculations - now always with isApproved=true
    await updateBudgetCalculations(validatedData.budgetId, validatedData.amount, true)

    // Track budget usage for history
    await trackBudgetUsage(validatedData.budgetId, validatedData.amount, id)

    // Revalidate the expenses page to reflect the changes
    revalidatePath("/pengeluaran")
    // Also revalidate the budget page to reflect the updated budget amounts
    revalidatePath("/anggaran")

    return {
      success: true,
      id,
      needsAllocation,
      additionalAllocationId,
      budgetUpdated: true,
      budgetId: validatedData.budgetId,
      expenseAmount: validatedData.amount,
    }
  } catch (error) {
    console.error("Error creating expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

// Remove the commented-out updateExpenseStatus function entirely since it's no longer needed.

// Get all expenses - updated to remove status filtering
export async function getExpenses() {
  try {
    // Get all expenses with budget name
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
        additional_allocation_id: string | null
      }[]
    >`
      SELECT 
        e.*, 
        b.name as budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id
      ORDER BY e.submitted_at DESC
    `

    return {
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        budgetId: expense.budget_id,
        budgetName: expense.budget_name,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at,
        notes: expense.notes || undefined,
        additionalAllocationId: expense.additional_allocation_id || undefined,
      })),
    }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a single expense by ID - updated to remove status references
export async function getExpenseById(id: string) {
  try {
    // Get the expense with budget name
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
        additional_allocation_id: string | null
      }[]
    >`
      SELECT 
        e.*, 
        b.name as budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id
      WHERE e.id = ${id}
    `

    if (expenses.length === 0) {
      return { success: false, error: "Expense not found" }
    }

    const expense = expenses[0]

    // If there's an additional allocation, get its details
    let additionalAllocation = null
    if (expense.additional_allocation_id) {
      const allocations = await sql<
        {
          id: string
          amount: number
          status: string
          reason: string
        }[]
      >`
        SELECT id, amount, status, reason
        FROM additional_allocations
        WHERE id = ${expense.additional_allocation_id}
      `

      if (allocations.length > 0) {
        additionalAllocation = {
          id: allocations[0].id,
          amount: allocations[0].amount,
          status: allocations[0].status,
          reason: allocations[0].reason,
        }
      }
    }

    return {
      success: true,
      expense: {
        id: expense.id,
        budgetId: expense.budget_id,
        budgetName: expense.budget_name,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at,
        notes: expense.notes || undefined,
        additionalAllocationId: expense.additional_allocation_id || undefined,
        additionalAllocation,
      },
    }
  } catch (error) {
    console.error("Error fetching expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get expense summary - updated to remove status filtering
export async function getExpenseSummary() {
  // Implement retry logic with exponential backoff
  const maxRetries = 3
  let retryCount = 0
  let lastError: any = null

  while (retryCount < maxRetries) {
    try {
      // Get total expense amount
      const totalResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses
      `
      const total = Number.parseFloat(totalResult[0]?.total || "0")

      // Get expenses with additional allocations
      const withAllocationResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE additional_allocation_id IS NOT NULL
      `
      const withAllocation = Number.parseFloat(withAllocationResult[0]?.total || "0")

      // Get expenses by month
      const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-indexed
      const currentYear = new Date().getFullYear()
      const monthlyResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE EXTRACT(MONTH FROM date::date) = ${currentMonth}
        AND EXTRACT(YEAR FROM date::date) = ${currentYear}
      `
      const monthly = Number.parseFloat(monthlyResult[0]?.total || "0")

      return {
        success: true,
        summary: {
          total,
          monthly,
          withAllocation,
        },
      }
    } catch (error) {
      lastError = error

      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("Too Many")) {
        console.log(`Rate limit hit, retrying (${retryCount + 1}/${maxRetries})...`)
        // Exponential backoff: wait longer between each retry
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        retryCount++
      } else {
        // If it's not a rate limit error, don't retry
        break
      }
    }
  }

  console.error("Error fetching expense summary:", lastError)
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : "An unknown error occurred",
  }
}

// Get expenses by budget ID - updated to remove status filtering
export async function getExpensesByBudgetId(budgetId: string) {
  try {
    const expenses = await sql<
      {
        id: string
        description: string
        amount: number
        date: string
        submitted_by: string
      }[]
    >`
      SELECT id, description, amount, date, submitted_by
      FROM expenses
      WHERE budget_id = ${budgetId}
      ORDER BY date DESC
    `

    return {
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        submittedBy: expense.submitted_by,
      })),
    }
  } catch (error) {
    console.error("Error fetching expenses by budget ID:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
