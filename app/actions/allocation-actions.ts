"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define types
export type AllocationStatus = "pending" | "approved" | "rejected"

export interface AdditionalAllocation {
  id: string
  originalBudgetId: string
  description: string
  reason: string
  amount: number
  requestDate: string
  status: AllocationStatus
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  relatedExpenseId?: string
  availableAmount: number // Calculated field
  spentAmount: number // Calculated field
}

// Validation schema for allocation creation
const allocationSchema = z.object({
  originalBudgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  requestDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  requestedBy: z.string().min(1, "Requester is required"),
  relatedExpenseId: z.string().optional(),
})

// Create a new additional allocation
export async function createAdditionalAllocation(formData: FormData) {
  try {
    // Extract and validate data
    const originalBudgetId = formData.get("originalBudgetId") as string
    const description = formData.get("description") as string
    const reason = formData.get("reason") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const requestDate = formData.get("requestDate") as string
    const requestedBy = formData.get("requestedBy") as string
    const relatedExpenseId = (formData.get("relatedExpenseId") as string) || undefined

    // Validate data
    const validatedData = allocationSchema.parse({
      originalBudgetId,
      description,
      reason,
      amount,
      requestDate,
      requestedBy,
      relatedExpenseId,
    })

    // Generate a unique ID
    const id = generateId("ADD")

    // Insert into database
    await sql`
      INSERT INTO additional_allocations (
        id, original_budget_id, description, reason, amount, 
        request_date, status, requested_by, related_expense_id
      ) VALUES (
        ${id}, 
        ${validatedData.originalBudgetId}, 
        ${validatedData.description}, 
        ${validatedData.reason}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.requestDate)}, 
        'pending', 
        ${validatedData.requestedBy},
        ${validatedData.relatedExpenseId}
      )
    `

    // If this allocation is related to an expense, update the expense
    if (validatedData.relatedExpenseId) {
      await sql`
        UPDATE expenses 
        SET additional_allocation_id = ${id}
        WHERE id = ${validatedData.relatedExpenseId}
      `
    }

    // Revalidate the allocations page to reflect the changes
    revalidatePath("/anggaran-tambahan")

    return { success: true, id }
  } catch (error) {
    console.error("Error creating additional allocation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get all additional allocations
export async function getAdditionalAllocations() {
  try {
    // Get all allocations with budget name
    const allocations = await sql<
      {
        id: string
        original_budget_id: string
        budget_name: string
        department: string
        description: string
        reason: string
        amount: number
        request_date: string
        status: AllocationStatus
        requested_by: string
        requested_at: string
        approved_by: string | null
        approved_at: string | null
        related_expense_id: string | null
      }[]
    >`
      SELECT 
        a.*, 
        b.name as budget_name,
        b.department
      FROM additional_allocations a
      JOIN budgets b ON a.original_budget_id = b.id
      ORDER BY a.requested_at DESC
    `

    // For each allocation, calculate the spent amount and available amount
    const allocationsWithCalculatedFields = await Promise.all(
      allocations.map(async (allocation) => {
        // Calculate spent amount from expenses that use this allocation
        const expensesResult = await sql<{ total: number }[]>`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM expenses 
          WHERE additional_allocation_id = ${allocation.id} AND status = 'approved'
        `
        const spentAmount = Number.parseFloat(expensesResult[0]?.total || "0")

        // Calculate available amount
        const availableAmount = allocation.amount - spentAmount

        return {
          id: allocation.id,
          originalBudgetId: allocation.original_budget_id,
          originalBudgetName: allocation.budget_name,
          department: allocation.department,
          description: allocation.description,
          reason: allocation.reason,
          amount: allocation.amount,
          requestDate: allocation.request_date,
          status: allocation.status,
          requestedBy: allocation.requested_by,
          requestedAt: allocation.requested_at,
          approvedBy: allocation.approved_by || undefined,
          approvedAt: allocation.approved_at || undefined,
          relatedExpenseId: allocation.related_expense_id || undefined,
          spentAmount,
          availableAmount,
        }
      }),
    )

    return { success: true, allocations: allocationsWithCalculatedFields }
  } catch (error) {
    console.error("Error fetching additional allocations:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a single additional allocation by ID
export async function getAdditionalAllocationById(id: string) {
  try {
    // Get the allocation with budget name
    const allocations = await sql<
      {
        id: string
        original_budget_id: string
        budget_name: string
        department: string
        description: string
        reason: string
        amount: number
        request_date: string
        status: AllocationStatus
        requested_by: string
        requested_at: string
        approved_by: string | null
        approved_at: string | null
        related_expense_id: string | null
      }[]
    >`
      SELECT 
        a.*, 
        b.name as budget_name,
        b.department
      FROM additional_allocations a
      JOIN budgets b ON a.original_budget_id = b.id
      WHERE a.id = ${id}
    `

    if (allocations.length === 0) {
      return { success: false, error: "Additional allocation not found" }
    }

    const allocation = allocations[0]

    // Calculate spent amount from expenses that use this allocation
    const expensesResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE additional_allocation_id = ${allocation.id} AND status = 'approved'
    `
    const spentAmount = Number.parseFloat(expensesResult[0]?.total || "0")

    // Calculate available amount
    const availableAmount = allocation.amount - spentAmount

    // If there's a related expense, get its details
    let relatedExpense = null
    if (allocation.related_expense_id) {
      const expenses = await sql<
        {
          id: string
          description: string
          amount: number
          status: string
        }[]
      >`
        SELECT id, description, amount, status
        FROM expenses
        WHERE id = ${allocation.related_expense_id}
      `

      if (expenses.length > 0) {
        relatedExpense = {
          id: expenses[0].id,
          description: expenses[0].description,
          amount: expenses[0].amount,
          status: expenses[0].status,
        }
      }
    }

    return {
      success: true,
      allocation: {
        id: allocation.id,
        originalBudgetId: allocation.original_budget_id,
        originalBudgetName: allocation.budget_name,
        department: allocation.department,
        description: allocation.description,
        reason: allocation.reason,
        amount: allocation.amount,
        requestDate: allocation.request_date,
        status: allocation.status,
        requestedBy: allocation.requested_by,
        requestedAt: allocation.requested_at,
        approvedBy: allocation.approved_by || undefined,
        approvedAt: allocation.approved_at || undefined,
        relatedExpenseId: allocation.related_expense_id || undefined,
        spentAmount,
        availableAmount,
        relatedExpense,
      },
    }
  } catch (error) {
    console.error("Error fetching additional allocation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Approve or reject an additional allocation
export async function updateAllocationStatus(id: string, status: AllocationStatus, approvedBy: string) {
  try {
    // Update the allocation status
    await sql`
      UPDATE additional_allocations 
      SET 
        status = ${status}, 
        approved_by = ${approvedBy}, 
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Revalidate the allocations page to reflect the changes
    revalidatePath("/anggaran-tambahan")

    return { success: true }
  } catch (error) {
    console.error("Error updating additional allocation status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get allocation summary (total, approved, pending)
export async function getAllocationSummary() {
  try {
    // Get total allocation amount
    const totalResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM additional_allocations
    `
    const total = Number.parseFloat(totalResult[0]?.total || "0")

    // Get approved allocation amount
    const approvedResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM additional_allocations WHERE status = 'approved'
    `
    const approved = Number.parseFloat(approvedResult[0]?.total || "0")

    // Get pending allocation amount
    const pendingResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM additional_allocations WHERE status = 'pending'
    `
    const pending = Number.parseFloat(pendingResult[0]?.total || "0")

    return {
      success: true,
      summary: {
        total,
        approved,
        pending,
      },
    }
  } catch (error) {
    console.error("Error fetching allocation summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
