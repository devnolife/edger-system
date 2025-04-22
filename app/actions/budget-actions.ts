"use server"

import { sql, generateId, formatDateForSQL } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define types
export type BudgetStatus = "active" | "completed" | "draft"

export interface Budget {
  id: string
  name: string
  department: string
  amount: number
  startDate: string
  endDate: string
  status: BudgetStatus
  description?: string
  createdBy: string
  createdAt: string
  availableAmount: number // Calculated field
  spentAmount: number // Calculated field
}

// Validation schema for budget creation
const budgetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  amount: z.number().positive("Amount must be positive"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  status: z.enum(["active", "completed", "draft"]),
  description: z.string().optional(),
  createdBy: z.string().min(1, "Creator is required"),
})

// Create a new budget
export async function createBudget(formData: FormData) {
  try {
    // Extract and validate data
    const name = formData.get("name") as string
    const department = formData.get("department") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const status = (formData.get("status") as BudgetStatus) || "draft"
    const description = (formData.get("description") as string) || ""
    const createdBy = formData.get("createdBy") as string

    // Validate data
    const validatedData = budgetSchema.parse({
      name,
      department,
      amount,
      startDate,
      endDate,
      status,
      description,
      createdBy,
    })

    // Generate a unique ID
    const id = generateId("BDG")

    // Insert into database
    await sql`
      INSERT INTO budgets (
        id, name, department, amount, start_date, end_date, 
        status, description, created_by
      ) VALUES (
        ${id}, ${validatedData.name}, ${validatedData.department}, 
        ${validatedData.amount}, ${formatDateForSQL(validatedData.startDate)}, 
        ${formatDateForSQL(validatedData.endDate)}, ${validatedData.status}, 
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

// Get all budgets with calculated fields
export async function getBudgets() {
  try {
    // Get all budgets
    const budgets = await sql<
      {
        id: string
        name: string
        department: string
        amount: number
        start_date: string
        end_date: string
        status: BudgetStatus
        description: string | null
        created_by: string
        created_at: string
      }[]
    >`
      SELECT * FROM budgets ORDER BY created_at DESC
    `

    // For each budget, calculate the spent amount and available amount
    const budgetsWithCalculatedFields = await Promise.all(
      budgets.map(async (budget) => {
        // Calculate spent amount from expenses
        const expensesResult = await sql<{ total: number }[]>`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM expenses 
          WHERE budget_id = ${budget.id} AND status = 'approved'
        `
        const spentAmount = Number.parseFloat(expensesResult[0]?.total || "0")

        // Calculate additional allocations
        const allocationsResult = await sql<{ total: number }[]>`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM additional_allocations 
          WHERE original_budget_id = ${budget.id} AND status = 'approved'
        `
        const additionalAmount = Number.parseFloat(allocationsResult[0]?.total || "0")

        // Calculate available amount
        const availableAmount = budget.amount + additionalAmount - spentAmount

        return {
          id: budget.id,
          name: budget.name,
          department: budget.department,
          amount: budget.amount,
          startDate: budget.start_date,
          endDate: budget.end_date,
          status: budget.status,
          description: budget.description || undefined,
          createdBy: budget.created_by,
          createdAt: budget.created_at,
          spentAmount,
          availableAmount,
        }
      }),
    )

    return { success: true, budgets: budgetsWithCalculatedFields }
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get a single budget by ID with calculated fields
export async function getBudgetById(id: string) {
  try {
    // Get the budget
    const budgets = await sql<
      {
        id: string
        name: string
        department: string
        amount: number
        start_date: string
        end_date: string
        status: BudgetStatus
        description: string | null
        created_by: string
        created_at: string
      }[]
    >`
      SELECT * FROM budgets WHERE id = ${id}
    `

    if (budgets.length === 0) {
      return { success: false, error: "Budget not found" }
    }

    const budget = budgets[0]

    // Calculate spent amount from expenses
    const expensesResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE budget_id = ${budget.id} AND status = 'approved'
    `
    const spentAmount = Number.parseFloat(expensesResult[0]?.total || "0")

    // Calculate additional allocations
    const allocationsResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM additional_allocations 
      WHERE original_budget_id = ${budget.id} AND status = 'approved'
    `
    const additionalAmount = Number.parseFloat(allocationsResult[0]?.total || "0")

    // Calculate available amount
    const availableAmount = budget.amount + additionalAmount - spentAmount

    return {
      success: true,
      budget: {
        id: budget.id,
        name: budget.name,
        department: budget.department,
        amount: budget.amount,
        startDate: budget.start_date,
        endDate: budget.end_date,
        status: budget.status,
        description: budget.description || undefined,
        createdBy: budget.created_by,
        createdAt: budget.created_at,
        spentAmount,
        availableAmount,
        additionalAmount,
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

// Update a budget
export async function updateBudget(id: string, formData: FormData) {
  try {
    // Extract and validate data
    const name = formData.get("name") as string
    const department = formData.get("department") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const status = formData.get("status") as BudgetStatus
    const description = (formData.get("description") as string) || ""

    // Validate data
    const validatedData = z
      .object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        department: z.string().min(1, "Department is required"),
        amount: z.number().positive("Amount must be positive"),
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
        status: z.enum(["active", "completed", "draft"]),
        description: z.string().optional(),
      })
      .parse({
        name,
        department,
        amount,
        startDate,
        endDate,
        status,
        description,
      })

    // Update in database
    await sql`
      UPDATE budgets 
      SET 
        name = ${validatedData.name}, 
        department = ${validatedData.department}, 
        amount = ${validatedData.amount}, 
        start_date = ${formatDateForSQL(validatedData.startDate)}, 
        end_date = ${formatDateForSQL(validatedData.endDate)}, 
        status = ${validatedData.status}, 
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

// Delete a budget
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

// Get budget summary (total, spent, available)
export async function getBudgetSummary() {
  try {
    // Get total budget amount
    const totalBudgetResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(amount), 0) as total FROM budgets WHERE status = 'active'
    `
    const totalBudget = Number.parseFloat(totalBudgetResult[0]?.total || "0")

    // Get total spent amount
    const totalSpentResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(e.amount), 0) as total 
      FROM expenses e 
      JOIN budgets b ON e.budget_id = b.id 
      WHERE e.status = 'approved' AND b.status = 'active'
    `
    const totalSpent = Number.parseFloat(totalSpentResult[0]?.total || "0")

    // Get total additional allocations
    const totalAdditionalResult = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(a.amount), 0) as total 
      FROM additional_allocations a 
      JOIN budgets b ON a.original_budget_id = b.id 
      WHERE a.status = 'approved' AND b.status = 'active'
    `
    const totalAdditional = Number.parseFloat(totalAdditionalResult[0]?.total || "0")

    // Calculate available amount
    const totalAvailable = totalBudget + totalAdditional - totalSpent

    return {
      success: true,
      summary: {
        totalBudget,
        totalSpent,
        totalAdditional,
        totalAvailable,
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
