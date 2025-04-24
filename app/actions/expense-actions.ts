"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getBudgetById } from "./budget-actions"
// Add this import at the top of the file
import { updateBudgetCalculations, trackBudgetUsage } from "@/lib/budget-update-service"

// Remove this line:
// export type ExpenseStatus = "pending" | "approved" | "rejected"

// Update the Expense interface to include imageUrl
export interface Expense {
  id: string
  budgetId: string
  budgetName?: string
  description: string
  amount: number
  date: string
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  additionalAllocationId?: string
  imageUrl?: string // Add this field
}

// Update the validation schema to require imageUrl
const expenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  submittedBy: z.string().min(1, "Submitter is required"),
  notes: z.string().optional(),
  imageUrl: z.string().min(1, "Receipt image is required"), // Add this field
})

// Update the createExpense function to handle image uploads
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
    const imageUrl = formData.get("imageUrl") as string // Get the image URL

    // Validate data
    const validatedData = expenseSchema.parse({
      budgetId,
      description,
      amount,
      date,
      submittedBy,
      notes,
      imageUrl, // Include imageUrl in validation
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

    // Insert the expense record - now including imageUrl
    await sql`
      INSERT INTO expenses (
        id, budget_id, description, amount, date, 
        submitted_by, notes, additional_allocation_id, image_url
      ) VALUES (
        ${id}, 
        ${validatedData.budgetId}, 
        ${validatedData.description}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.date)}, 
        ${validatedData.submittedBy}, 
        ${validatedData.notes},
        ${additionalAllocationId},
        ${validatedData.imageUrl} // Add the image URL
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

// Update the getExpenses function to include imageUrl
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
        image_url: string | null // Add this field
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
        imageUrl: expense.image_url || undefined, // Include imageUrl in the response
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

// Update the getExpenseById function to include imageUrl
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
        image_url: string | null // Add this field
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
        imageUrl: expense.image_url || undefined, // Include imageUrl in the response
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

// New function to get expenses by budget ID
export async function getExpensesByBudgetId(budgetId: string) {
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
        additional_allocation_id: string | null
        image_url: string | null
      }[]
    >`
      SELECT 
        e.*, 
        b.name as budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id
      WHERE e.budget_id = ${budgetId}
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
        imageUrl: expense.image_url || undefined,
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

// New function to get expense summary
export async function getExpenseSummary() {
  try {
    const result = await sql<
      {
        total: number
        approved: number
        pending: number
        with_allocation: number
      }[]
    >`
      SELECT 
        COALESCE(SUM(amount), 0) AS total,
        COALESCE(SUM(CASE WHEN additional_allocation_id IS NULL THEN amount ELSE 0 END), 0) AS approved,
        0 AS pending,
        COALESCE(SUM(CASE WHEN additional_allocation_id IS NOT NULL THEN amount ELSE 0 END), 0) AS with_allocation
      FROM expenses
    `

    const summary = {
      total: Number(result[0]?.total || 0),
      approved: Number(result[0]?.approved || 0),
      pending: Number(result[0]?.pending || 0),
      withAllocation: Number(result[0]?.with_allocation || 0),
    }

    return { success: true, summary }
  } catch (error) {
    console.error("Error fetching expense summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
