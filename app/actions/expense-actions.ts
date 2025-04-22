"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define types
export type ExpenseStatus = "pending" | "approved" | "rejected"

export interface Expense {
  id: string
  budgetId: string
  description: string
  amount: number
  date: string
  department: string
  status: ExpenseStatus
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  additionalAllocationId?: string
}

// Validation schema for expense creation
const expenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  department: z.string().min(1, "Department is required"),
  submittedBy: z.string().min(1, "Submitter is required"),
  notes: z.string().optional(),
})

// Create a new expense
export async function createExpense(formData: FormData) {
  try {
    // Extract and validate data
    const budgetId = formData.get("budgetId") as string
    const description = formData.get("description") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const date = formData.get("date") as string
    const department = formData.get("department") as string
    const submittedBy = formData.get("submittedBy") as string
    const notes = (formData.get("notes") as string) || ""

    // Validate data
    const validatedData = expenseSchema.parse({
      budgetId,
      description,
      amount,
      date,
      department,
      submittedBy,
      notes,
    })

    // Generate a unique ID
    const id = generateId("EXP")

    // Check if the expense exceeds the available budget
    const budgetResult = await sql<
      {
        id: string
        amount: number
        spent: number
        additional: number
      }[]
    >`
      WITH 
        budget_spent AS (
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM expenses 
          WHERE budget_id = ${validatedData.budgetId} AND status = 'approved'
        ),
        budget_additional AS (
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM additional_allocations 
          WHERE original_budget_id = ${validatedData.budgetId} AND status = 'approved'
        )
      SELECT 
        b.id, 
        b.amount, 
        (SELECT total FROM budget_spent) as spent,
        (SELECT total FROM budget_additional) as additional
      FROM budgets b
      WHERE b.id = ${validatedData.budgetId}
    `

    if (budgetResult.length === 0) {
      return { success: false, error: "Budget not found" }
    }

    const budget = budgetResult[0]
    const availableAmount =
      budget.amount + Number.parseFloat(budget.additional.toString()) - Number.parseFloat(budget.spent.toString())

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

    // Insert expense into database
    await sql`
      INSERT INTO expenses (
        id, budget_id, description, amount, date, 
        department, status, submitted_by, notes,
        additional_allocation_id
      ) VALUES (
        ${id}, 
        ${validatedData.budgetId}, 
        ${validatedData.description}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.date)}, 
        ${validatedData.department}, 
        'pending', 
        ${validatedData.submittedBy}, 
        ${validatedData.notes},
        ${additionalAllocationId}
      )
    `

    // Revalidate the expenses page to reflect the changes
    revalidatePath("/pengeluaran")

    return {
      success: true,
      id,
      needsAllocation,
      additionalAllocationId,
    }
  } catch (error) {
    console.error("Error creating expense:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
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
        department: string
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
        department: expense.department,
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
        department: string
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
        department: expense.department,
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

// Approve or reject an expense
export async function updateExpenseStatus(id: string, status: ExpenseStatus, approvedBy: string) {
  try {
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

    // If the expense has an additional allocation and the expense is approved,
    // also approve the additional allocation
    if (status === "approved") {
      await sql`
        UPDATE additional_allocations
        SET 
          status = 'approved', 
          approved_by = ${approvedBy}, 
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE related_expense_id = ${id}
      `
    }

    // If the expense is rejected, also reject any associated additional allocation
    if (status === "rejected") {
      await sql`
        UPDATE additional_allocations
        SET 
          status = 'rejected', 
          approved_by = ${approvedBy}, 
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE related_expense_id = ${id}
      `
    }

    // Revalidate the expenses page to reflect the changes
    revalidatePath("/pengeluaran")

    return { success: true }
  } catch (error) {
    console.error("Error updating expense status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get expense summary (total, approved, pending)
export async function getExpenseSummary() {
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
    console.error("Error fetching expense summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
