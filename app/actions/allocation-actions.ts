"use server"

import { sql, generateId, formatDateForSQL, executeQueryWithRetry } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define types - removed AllocationStatus type since it's no longer needed
export interface AdditionalAllocation {
  id: string
  originalBudgetId: string
  originalBudgetName?: string
  description: string
  reason: string
  amount: number
  requestDate: string
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  relatedExpenseId?: string
  availableAmount: number
  spentAmount: number
  relatedExpense?: any
}

// Add the validation schema
const allocationSchema = z.object({
  originalBudgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  requestDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  requestedBy: z.string().min(1, "Requester is required"),
  relatedExpenseId: z.string().optional(),
})

// Create a new additional allocation - removed status field
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

    // Insert into database - without status field
    // All allocations are automatically approved
    await executeQueryWithRetry(
      () => sql`
      INSERT INTO additional_allocations (
        id, original_budget_id, description, reason, amount, 
        request_date, requested_by, related_expense_id,
        approved_by, approved_at
      ) VALUES (
        ${id}, 
        ${validatedData.originalBudgetId}, 
        ${validatedData.description}, 
        ${validatedData.reason}, 
        ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.requestDate)}, 
        ${validatedData.requestedBy},
        ${validatedData.relatedExpenseId},
        ${validatedData.requestedBy},
        CURRENT_TIMESTAMP
      )
    `,
    )

    // If this allocation is related to an expense, update the expense
    if (validatedData.relatedExpenseId) {
      await executeQueryWithRetry(
        () => sql`
        UPDATE expenses 
        SET additional_allocation_id = ${id}
        WHERE id = ${validatedData.relatedExpenseId}
      `,
      )
    }

    // Revalidate the allocations page to reflect the changes
    revalidatePath("/anggaran-tambahan")
    // Also revalidate the budget page to reflect the updated budget amounts
    revalidatePath("/anggaran")

    return { success: true, id }
  } catch (error) {
    console.error("Error creating additional allocation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get all additional allocations - removed status filtering
export async function getAdditionalAllocations() {
  try {
    // Use executeQueryWithRetry to handle rate limiting
    const allocations = await executeQueryWithRetry(
      () => sql<
        {
          id: string
          original_budget_id: string
          budget_name: string | null
          description: string
          reason: string
          amount: number
          request_date: string
          requested_by: string
          requested_at: string
          approved_by: string | null
          approved_at: string | null
          related_expense_id: string | null
        }[]
      >`
      SELECT 
        a.id, 
        a.original_budget_id, 
        a.description, 
        a.reason, 
        a.amount, 
        a.request_date, 
        a.requested_by, 
        a.requested_at, 
        a.approved_by, 
        a.approved_at, 
        a.related_expense_id,
        b.name as budget_name
      FROM additional_allocations a
      LEFT JOIN budgets b ON a.original_budget_id = b.id
      ORDER BY a.requested_at DESC
    `,
    )

    // If no allocations, return empty array
    if (allocations.length === 0) {
      return { success: true, allocations: [] }
    }

    // Get all allocation IDs
    const allocationIds = allocations.map((allocation) => allocation.id)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get all expenses related to these allocations in a single query
    const expensesResult = await executeQueryWithRetry(
      () => sql<{ additional_allocation_id: string; total: number }[]>`
      SELECT additional_allocation_id, COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE additional_allocation_id = ANY(${allocationIds})
      GROUP BY additional_allocation_id
    `,
    )

    // Create a map of allocation_id to spent amount
    const spentAmountMap = new Map<string, number>()
    expensesResult.forEach((row) => {
      spentAmountMap.set(row.additional_allocation_id, Number(row.total))
    })

    // Map the allocations with calculated fields
    const allocationsWithCalculatedFields = allocations.map((allocation) => {
      const spentAmount = spentAmountMap.get(allocation.id) || 0
      const availableAmount = allocation.amount - spentAmount

      return {
        id: allocation.id,
        originalBudgetId: allocation.original_budget_id,
        originalBudgetName: allocation.budget_name || undefined,
        description: allocation.description,
        reason: allocation.reason,
        amount: allocation.amount,
        requestDate: allocation.request_date,
        requestedBy: allocation.requested_by,
        requestedAt: allocation.requested_at,
        approvedBy: allocation.approved_by || undefined,
        approvedAt: allocation.approved_at || undefined,
        relatedExpenseId: allocation.related_expense_id || undefined,
        spentAmount,
        availableAmount,
      }
    })

    return { success: true, allocations: allocationsWithCalculatedFields }
  } catch (error) {
    console.error("Error fetching additional allocations:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a single additional allocation by ID - removed status references
export async function getAdditionalAllocationById(id: string) {
  try {
    // Use executeQueryWithRetry to handle rate limiting
    const allocations = await executeQueryWithRetry(
      () => sql<
        {
          id: string
          original_budget_id: string
          budget_name: string | null
          description: string
          reason: string
          amount: number
          request_date: string
          requested_by: string
          requested_at: string
          approved_by: string | null
          approved_at: string | null
          related_expense_id: string | null
        }[]
      >`
      SELECT 
        a.*, 
        b.name as budget_name
      FROM additional_allocations a
      LEFT JOIN budgets b ON a.original_budget_id = b.id
      WHERE a.id = ${id}
    `,
    )

    if (allocations.length === 0) {
      return { success: false, error: "Additional allocation not found" }
    }

    const allocation = allocations[0]

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Calculate spent amount from expenses that use this allocation
    const expensesResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE additional_allocation_id = ${allocation.id}
    `,
    )

    const spentAmount = Number(expensesResult[0]?.total || 0)

    // Calculate available amount
    const availableAmount = allocation.amount - spentAmount

    // If there's a related expense, get its details
    let relatedExpense = null
    if (allocation.related_expense_id) {
      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))

      const expenses = await executeQueryWithRetry(
        () => sql<
          {
            id: string
            description: string
            amount: number
          }[]
        >`
        SELECT id, description, amount
        FROM expenses
        WHERE id = ${allocation.related_expense_id}
      `,
      )

      if (expenses.length > 0) {
        relatedExpense = {
          id: expenses[0].id,
          description: expenses[0].description,
          amount: expenses[0].amount,
        }
      }
    }

    return {
      success: true,
      allocation: {
        id: allocation.id,
        originalBudgetId: allocation.original_budget_id,
        originalBudgetName: allocation.budget_name || undefined,
        description: allocation.description,
        reason: allocation.reason,
        amount: allocation.amount,
        requestDate: allocation.request_date,
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

// Get allocation summary - removed status filtering
export async function getAllocationSummary() {
  try {
    // Use executeQueryWithRetry to handle rate limiting
    const totalResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM additional_allocations
    `,
    )

    const total = Number(totalResult[0]?.total || 0)

    return {
      success: true,
      summary: {
        total,
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
