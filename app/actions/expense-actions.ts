"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getBudgetById } from "./budget-actions"
// Add this import at the top of the file
import { updateBudgetCalculations, trackBudgetUsage } from "@/lib/budget-update-service"

// Define types
export type ExpenseStatus = "pending" | "approved" | "rejected"

// Update the Expense interface to remove the department field
export interface Expense {
  id: string
  budgetId: string
  description: string
  amount: number
  date: string
  status: ExpenseStatus
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  additionalAllocationId?: string
}

// Update the validation schema to remove the department field
const expenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  submittedBy: z.string().min(1, "Submitter is required"),
  notes: z.string().optional(),
})

// Then modify the createExpense function to include the budget update
export async function createExpense(formData: FormData) {
  try {
    // Extract and validate data
    const budgetId = formData.get("budgetId") as string
    const description = formData.get("description") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
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

      // Create an additional allocation
      additionalAllocationId = generateId("ADD")

      await sql`
        INSERT INTO additional_allocations (
          id, original_budget_id, description, reason, amount, 
          request_date, status, requested_by, related_expense_id
        ) VALUES (
          ${additionalAllocationId}, 
          ${validatedData.budgetId}, 
          ${"Alokasi tambahan untuk: " + validatedData.description}, 
          ${"Pengeluaran melebihi anggaran yang tersedia"}, 
          ${shortageAmount}, 
          ${formatDateForSQL(validatedData.date)}, 
          'pending', 
          ${validatedData.submittedBy},
          ${id}
        )
      `
    }

    // Insert the expense record
    await sql`
      INSERT INTO expenses (
        id, budget_id, description, amount, date, 
        status, submitted_by, notes,
        additional_allocation_id
      ) VALUES (
        ${id}, 
        ${validatedData.budgetId}, 
        ${validatedData.description}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.date)}, 
        'pending', 
        ${validatedData.submittedBy}, 
        ${validatedData.notes},
        ${additionalAllocationId}
      )
    `

    // Update budget calculations
    await updateBudgetCalculations(validatedData.budgetId, validatedData.amount)

    // Track budget usage for history (this won't cause errors now)
    await trackBudgetUsage(validatedData.budgetId, validatedData.amount, id)

    // Emit a budget update event for real-time UI updates
    // This is a client-side function, so we can't call it directly from a server action
    // Instead, we'll rely on the client to emit the event when it receives the response

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

// Modify the updateExpenseStatus function
export async function updateExpenseStatus(id: string, status: ExpenseStatus, approvedBy: string) {
  try {
    // Get the expense details first to know the budget and amount
    const expenseResult = await sql<
      {
        id: string
        budget_id: string
        amount: number
        additional_allocation_id: string | null
      }[]
    >`
      SELECT id, budget_id, amount, additional_allocation_id
      FROM expenses
      WHERE id = ${id}
    `

    if (expenseResult.length === 0) {
      return { success: false, error: "Expense not found" }
    }

    const expense = expenseResult[0]

    // Update the expense status
    await sql`
      UPDATE expenses 
      SET 
        status = ${status}, 
        approved_by = ${approvedBy}, 
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // If the expense is approved, update the budget's available amount
    if (status === "approved") {
      // Update budget calculations with the approved flag
      await updateBudgetCalculations(expense.budget_id, Number(expense.amount), true)

      // If there's an additional allocation request, approve it as well
      if (expense.additional_allocation_id) {
        await sql`
          UPDATE additional_allocations
          SET 
            status = 'approved', 
            approved_by = ${approvedBy}, 
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${expense.additional_allocation_id}
        `
      }
    }

    // If the expense is rejected, also reject any associated additional allocation
    if (status === "rejected") {
      if (expense.additional_allocation_id) {
        await sql`
          UPDATE additional_allocations
          SET 
            status = 'rejected', 
            approved_by = ${approvedBy}, 
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${expense.additional_allocation_id}
        `
      }
    }

    // Revalidate the expenses page to reflect the changes
    revalidatePath("/pengeluaran")
    // Also revalidate the budget page to reflect the updated budget amounts
    revalidatePath("/anggaran")
    // Revalidate the additional allocations page if there was an allocation
    if (expense.additional_allocation_id) {
      revalidatePath("/anggaran-tambahan")
    }

    return {
      success: true,
      budgetId: expense.budget_id,
      expenseAmount: Number(expense.amount),
    }
  } catch (error) {
    console.error("Error updating expense status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

// Get all expenses
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
        status: ExpenseStatus
        submitted_by: string
        submitted_at: string
        approved_by: string | null
        approved_at: string | null
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
        status: expense.status,
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at,
        approvedBy: expense.approved_by || undefined,
        approvedAt: expense.approved_at || undefined,
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

// Get a single expense by ID
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
        status: ExpenseStatus
        submitted_by: string
        submitted_at: string
        approved_by: string | null
        approved_at: string | null
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
        status: expense.status,
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at,
        approvedBy: expense.approved_by || undefined,
        approvedAt: expense.approved_at || undefined,
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

// Get expense summary (total, approved, pending)
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

      // Get approved expense amount
      const approvedResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved'
      `
      const approved = Number.parseFloat(approvedResult[0]?.total || "0")

      // Get pending expense amount
      const pendingResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'pending'
      `
      const pending = Number.parseFloat(pendingResult[0]?.total || "0")

      // Get expenses with additional allocations
      const withAllocationResult = await sql<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE additional_allocation_id IS NOT NULL
      `
      const withAllocation = Number.parseFloat(withAllocationResult[0]?.total || "0")

      return {
        success: true,
        summary: {
          total,
          approved,
          pending,
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

// Get expenses by budget ID
export async function getExpensesByBudgetId(budgetId: string) {
  try {
    const expenses = await sql<
      {
        id: string
        description: string
        amount: number
        date: string
        status: ExpenseStatus
        submitted_by: string
      }[]
    >`
      SELECT id, description, amount, date, status, submitted_by
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
        status: expense.status,
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
