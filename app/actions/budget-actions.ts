"use server"

import { sql, generateId, formatDateForSQL, executeQueryWithRetry } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define types - removed BudgetStatus type since it's no longer needed
export interface Budget {
  id: string
  name: string
  amount: number
  startDate: string
  description?: string
  createdBy: string
  createdAt: string
  availableAmount: number // Calculated field
  spentAmount: number // Calculated field
  additionalAmount?: number // Optional calculated field
}

// Validation schema for budget creation - removed status field
const budgetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  creationDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid creation date"),
  description: z.string().optional(),
  createdBy: z.string().min(1, "Creator is required"),
})

// Create a new budget - removed status parameter
export async function createBudget(formData: FormData) {
  try {
    // Extract and validate data
    const name = formData.get("name") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const creationDate = formData.get("creationDate") as string
    const description = (formData.get("description") as string) || ""
    const createdBy = formData.get("createdBy") as string

    // Validate data
    const validatedData = budgetSchema.parse({
      name,
      amount,
      creationDate,
      description,
      createdBy,
    })

    // Generate a unique ID
    const id = generateId("BDG")

    // Insert into database - removed status field
    await sql`
      INSERT INTO budgets (
        id, name, amount, start_date, 
        description, created_by
      ) VALUES (
        ${id}, ${validatedData.name}, ${validatedData.amount}, 
        ${formatDateForSQL(validatedData.creationDate)}, 
        ${validatedData.description}, ${validatedData.createdBy}
      )
    `

    // Revalidate the budgets page to reflect the changes
    revalidatePath("/anggaran")

    return { success: true, id }
  } catch (error) {
    console.error("Error creating budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Modify the getBudgets function to handle rate limiting better
export async function getBudgets() {
  try {
    // Get all budgets
    const budgets = await executeQueryWithRetry(
      () => sql<
        {
          id: string
          name: string
          amount: number
          start_date: string
          description: string | null
          created_by: string
          created_at: string
        }[]
      >`
      SELECT * FROM budgets ORDER BY created_at DESC
    `,
    )

    // Instead of querying for each budget individually, do batch queries
    // Get all budget IDs
    const budgetIds = budgets.map((budget) => budget.id)

    // If no budgets, return empty array
    if (budgetIds.length === 0) {
      return { success: true, budgets: [] }
    }

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get all expenses in a single query
    const expensesResult = await executeQueryWithRetry(
      () => sql<{ budget_id: string; total: number }[]>`
      SELECT budget_id, COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE budget_id = ANY(${budgetIds})
      GROUP BY budget_id
    `,
    )

    // Create a map of budget_id to spent amount
    const spentAmountMap = new Map<string, number>()
    expensesResult.forEach((row) => {
      spentAmountMap.set(row.budget_id, Number(row.total))
    })

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get all additional allocations in a single query
    // Note: We're keeping the status='approved' filter for now since we haven't migrated this table yet
    const allocationsResult = await executeQueryWithRetry(
      () => sql<{ original_budget_id: string; total: number }[]>`
      SELECT original_budget_id, COALESCE(SUM(amount), 0) as total 
      FROM additional_allocations 
      WHERE original_budget_id = ANY(${budgetIds})
      GROUP BY original_budget_id
    `,
    )

    // Create a map of budget_id to additional amount
    const additionalAmountMap = new Map<string, number>()
    allocationsResult.forEach((row) => {
      additionalAmountMap.set(row.original_budget_id, Number(row.total))
    })

    // Map the budgets with calculated fields
    const budgetsWithCalculatedFields = budgets.map((budget) => {
      const spentAmount = spentAmountMap.get(budget.id) || 0
      const additionalAmount = additionalAmountMap.get(budget.id) || 0
      const availableAmount = budget.amount + additionalAmount - spentAmount

      return {
        id: budget.id,
        name: budget.name,
        amount: budget.amount,
        startDate: budget.start_date,
        description: budget.description || undefined,
        createdBy: budget.created_by,
        createdAt: budget.created_at,
        spentAmount,
        availableAmount,
        additionalAmount,
      }
    })

    return { success: true, budgets: budgetsWithCalculatedFields }
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a single budget by ID with calculated fields - removed status references
export async function getBudgetById(id: string) {
  try {
    // Get the budget
    const budgets = await executeQueryWithRetry(
      () => sql<
        {
          id: string
          name: string
          amount: number
          start_date: string
          description: string | null
          created_by: string
          created_at: string
        }[]
      >`
      SELECT * FROM budgets WHERE id = ${id}
    `,
    )

    if (budgets.length === 0) {
      return { success: false, error: "Budget not found" }
    }

    const budget = budgets[0]

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Calculate spent amount from expenses
    const expensesResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE budget_id = ${budget.id}
    `,
    )

    const spentAmount = Number(expensesResult[0]?.total || 0)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Calculate additional allocations
    const allocationsResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM additional_allocations 
      WHERE original_budget_id = ${budget.id}
    `,
    )

    const additionalAmount = Number(allocationsResult[0]?.total || 0)

    // Calculate available amount
    const availableAmount = budget.amount + additionalAmount - spentAmount

    return {
      success: true,
      budget: {
        id: budget.id,
        name: budget.name,
        amount: budget.amount,
        startDate: budget.start_date,
        description: budget.description || undefined,
        createdBy: budget.created_by,
        createdAt: budget.created_at,
        spentAmount,
        availableAmount,
        additionalAmount,
        pendingAmount: 0, // All expenses are now automatically approved
      },
    }
  } catch (error) {
    console.error("Error fetching budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Update a budget - removed status field
export async function updateBudget(id: string, formData: FormData) {
  try {
    // Extract and validate data
    const name = formData.get("name") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const description = (formData.get("description") as string) || ""

    // Validate data
    const validatedData = z
      .object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        amount: z.number().positive("Amount must be positive"),
        description: z.string().optional(),
      })
      .parse({
        name,
        amount,
        description,
      })

    // Update in database - removed status field
    await sql`
      UPDATE budgets 
      SET 
        name = ${validatedData.name}, 
        amount = ${validatedData.amount}, 
        description = ${validatedData.description},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Revalidate the budgets page to reflect the changes
    revalidatePath("/anggaran")

    return { success: true }
  } catch (error) {
    console.error("Error updating budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Delete a budget - no changes needed here
export async function deleteBudget(id: string) {
  try {
    // Check if there are any expenses associated with this budget
    const expensesResult = await sql<{ count: number }[]>`
      SELECT COUNT(*) as count FROM expenses WHERE budget_id = ${id}
    `

    if (Number.parseInt(expensesResult[0]?.count.toString() || "0") > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated expenses. Please delete the expenses first.",
      }
    }

    // Check if there are any additional allocations associated with this budget
    const allocationsResult = await sql<{ count: number }[]>`
      SELECT COUNT(*) as count FROM additional_allocations WHERE original_budget_id = ${id}
    `

    if (Number.parseInt(allocationsResult[0]?.count.toString() || "0") > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated additional allocations. Please delete the allocations first.",
      }
    }

    // Delete from database
    await sql`DELETE FROM budgets WHERE id = ${id}`

    // Revalidate the budgets page to reflect the changes
    revalidatePath("/anggaran")

    return { success: true }
  } catch (error) {
    console.error("Error deleting budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get budget summary - removed status filtering
export async function getBudgetSummary() {
  try {
    // Get total budget amount
    const totalBudgetResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM budgets
    `,
    )

    const totalBudget = Number(totalBudgetResult[0]?.total || 0)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get total spent amount
    const totalSpentResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(e.amount), 0) as total 
      FROM expenses e 
      JOIN budgets b ON e.budget_id = b.id
    `,
    )

    const totalSpent = Number(totalSpentResult[0]?.total || 0)

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Get total additional allocations
    const totalAdditionalResult = await executeQueryWithRetry(
      () => sql<{ total: number }[]>`
      SELECT COALESCE(SUM(a.amount), 0) as total 
      FROM additional_allocations a 
      JOIN budgets b ON a.original_budget_id = b.id
    `,
    )

    const totalAdditional = Number(totalAdditionalResult[0]?.total || 0)

    // Calculate available amount
    const totalAvailable = totalBudget + totalAdditional - totalSpent

    return {
      success: true,
      summary: {
        totalBudget,
        totalSpent,
        totalAdditional,
        totalAvailable,
        totalPending: 0, // All expenses are now automatically approved
      },
    }
  } catch (error) {
    console.error("Error fetching budget summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
