"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db, generateId, formatDateForSQL } from "@/lib/db"
import { eq, sql as sqlExpr } from "drizzle-orm"
import { budgets, expenses, additionalAllocations } from "@/lib/schema"

// Define types
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

// Validation schema for budget creation
const budgetSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  creationDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid creation date"),
  description: z.string().optional(),
  createdBy: z.string().min(1, "Creator is required"),
})

// Function to check if the budgets table exists
async function ensureBudgetsTableExists() {
  try {
    // Dengan Drizzle, kita tidak perlu memeriksa keberadaan tabel secara manual
    // karena migrasi akan menangani hal ini
    return true
  } catch (error) {
    console.error("Error checking budgets table:", error)
    return false
  }
}

// Create a new budget
export async function createBudget(formData: FormData) {
  try {
    // Ensure the budgets table exists
    const tableExists = await ensureBudgetsTableExists()
    if (!tableExists) {
      return {
        success: false,
        error: "Failed to ensure budgets table exists. Please check database connection.",
      }
    }

    // Extract and validate data
    const name = formData.get("name") as string
    const amountStr = formData.get("amount") as string
    const creationDate = formData.get("creationDate") as string
    const description = (formData.get("description") as string) || ""
    const createdBy = formData.get("createdBy") as string

    // Parse amount with better error handling
    let amount: number
    try {
      // Handle both formatted strings (with commas) and regular numbers
      amount =
        typeof amountStr === "string" && amountStr.includes(",")
          ? Number.parseFloat(amountStr.replace(/[^\d.-]/g, ""))
          : Number.parseFloat(amountStr)

      if (isNaN(amount)) {
        throw new Error("Invalid amount format")
      }
    } catch (error) {
      console.error("Error parsing amount:", error)
      return {
        success: false,
        error: "Invalid amount format. Please enter a valid number.",
      }
    }

    // Validate data
    try {
      budgetSchema.parse({
        name,
        amount,
        creationDate,
        description,
        createdBy,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
        return {
          success: false,
          error: `Validation error: ${errorMessages}`,
        }
      }
      throw error
    }

    // Generate a unique ID
    const id = generateId("BDG")

    // Format the date properly
    const formattedDate = formatDateForSQL(creationDate)

    // Insert budget using Drizzle ORM
    await db.insert(budgets).values({
      id,
      name,
      amount,
      startDate: new Date(formattedDate),
      description,
      createdBy,
      createdAt: new Date(),
    })

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

// Get all budgets
export async function getBudgets() {
  try {
    // Get all budgets using Drizzle ORM
    const budgetsData = await db.select().from(budgets).orderBy(budgets.createdAt)

    // If no budgets, return empty array
    if (budgetsData.length === 0) {
      return { success: true, budgets: [] }
    }

    // Get all budget IDs
    const budgetIds = budgetsData.map((budget) => budget.id)

    // Get all expenses in a single query
    const expensesResult = await db
      .select({
        budgetId: expenses.budgetId,
        total: sqlExpr`SUM(${expenses.amount})::numeric`,
      })
      .from(expenses)
      .where(sqlExpr`${expenses.budgetId} = ANY(${budgetIds})`)
      .groupBy(expenses.budgetId)

    // Create a map of budget_id to spent amount
    const spentAmountMap = new Map<string, number>()
    expensesResult.forEach((row) => {
      spentAmountMap.set(row.budgetId, Number(row.total) || 0)
    })

    // Get all additional allocations in a single query
    const allocationsResult = await db
      .select({
        originalBudgetId: additionalAllocations.originalBudgetId,
        total: sqlExpr`SUM(${additionalAllocations.amount})::numeric`,
      })
      .from(additionalAllocations)
      .where(sqlExpr`${additionalAllocations.originalBudgetId} = ANY(${budgetIds})`)
      .groupBy(additionalAllocations.originalBudgetId)

    // Create a map of budget_id to additional amount
    const additionalAmountMap = new Map<string, number>()
    allocationsResult.forEach((row) => {
      additionalAmountMap.set(row.originalBudgetId, Number(row.total) || 0)
    })

    // Map the budgets with calculated fields
    const budgetsWithCalculatedFields = budgetsData.map((budget) => {
      const spentAmount = spentAmountMap.get(budget.id) || 0
      const additionalAmount = additionalAmountMap.get(budget.id) || 0
      const availableAmount = Number(budget.amount) + additionalAmount - spentAmount

      return {
        id: budget.id,
        name: budget.name,
        amount: Number(budget.amount),
        startDate: budget.startDate instanceof Date ? budget.startDate.toISOString().split("T")[0] : budget.startDate,
        description: budget.description || undefined,
        createdBy: budget.createdBy,
        createdAt: budget.createdAt instanceof Date ? budget.createdAt.toISOString() : budget.createdAt,
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

// Get a single budget by ID with calculated fields
export async function getBudgetById(id: string) {
  try {
    // Get the budget using Drizzle ORM
    const budgetResult = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1)

    if (budgetResult.length === 0) {
      return { success: false, error: "Budget not found" }
    }

    const budget = budgetResult[0]

    // Calculate spent amount from expenses
    const expensesResult = await db
      .select({
        total: sqlExpr`COALESCE(SUM(${expenses.amount}), 0)::numeric`,
      })
      .from(expenses)
      .where(eq(expenses.budgetId, budget.id))

    const spentAmount = Number(expensesResult[0]?.total || 0)

    // Calculate additional allocations
    const allocationsResult = await db
      .select({
        total: sqlExpr`COALESCE(SUM(${additionalAllocations.amount}), 0)::numeric`,
      })
      .from(additionalAllocations)
      .where(eq(additionalAllocations.originalBudgetId, budget.id))

    const additionalAmount = Number(allocationsResult[0]?.total || 0)

    // Calculate available amount
    const availableAmount = Number(budget.amount) + additionalAmount - spentAmount

    return {
      success: true,
      budget: {
        id: budget.id,
        name: budget.name,
        amount: Number(budget.amount),
        startDate: budget.startDate instanceof Date ? budget.startDate.toISOString().split("T")[0] : budget.startDate,
        description: budget.description || undefined,
        createdBy: budget.createdBy,
        createdAt: budget.createdAt instanceof Date ? budget.createdAt.toISOString() : budget.createdAt,
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

// Update a budget
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

    // Update in database using Drizzle ORM
    await db
      .update(budgets)
      .set({
        name: validatedData.name,
        amount: validatedData.amount,
        description: validatedData.description,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id))

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
    const expensesCount = await db
      .select({
        count: sqlExpr`COUNT(*)`,
      })
      .from(expenses)
      .where(eq(expenses.budgetId, id))

    if (Number(expensesCount[0]?.count || 0) > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated expenses. Please delete the expenses first.",
      }
    }

    // Check if there are any additional allocations associated with this budget
    const allocationsCount = await db
      .select({
        count: sqlExpr`COUNT(*)`,
      })
      .from(additionalAllocations)
      .where(eq(additionalAllocations.originalBudgetId, id))

    if (Number(allocationsCount[0]?.count || 0) > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated additional allocations. Please delete the allocations first.",
      }
    }

    // Delete from database using Drizzle ORM
    await db.delete(budgets).where(eq(budgets.id, id))

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

// Delete a budget along with all associated expenses
export async function deleteBudgetWithExpenses(id: string) {
  try {
    // Delete all expenses associated with this budget
    const deleteExpensesResult = await db.delete(expenses).where(eq(expenses.budgetId, id)).returning()
    const deletedExpensesCount = deleteExpensesResult.length

    // Delete any additional allocations associated with this budget
    const deleteAllocationsResult = await db
      .delete(additionalAllocations)
      .where(eq(additionalAllocations.originalBudgetId, id))
      .returning()
    const deletedAllocationsCount = deleteAllocationsResult.length

    // Delete the budget itself
    const deleteBudgetResult = await db.delete(budgets).where(eq(budgets.id, id)).returning()

    if (deleteBudgetResult.length === 0) {
      return {
        success: false,
        error: "Budget not found",
      }
    }

    // Revalidate the budgets page to reflect the changes
    revalidatePath("/anggaran")
    revalidatePath("/pengeluaran")

    return {
      success: true,
      deletedExpenses: deletedExpensesCount,
      deletedAllocations: deletedAllocationsCount,
    }
  } catch (error) {
    console.error("Error deleting budget with expenses:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get budget summary
export async function getBudgetSummary() {
  try {
    // Get total budget amount
    const totalBudgetResult = await db
      .select({
        total: sqlExpr`COALESCE(SUM(${budgets.amount}), 0)::numeric`,
      })
      .from(budgets)

    const totalBudget = Number(totalBudgetResult[0]?.total || 0)

    // Get total spent amount
    const totalSpentResult = await db
      .select({
        total: sqlExpr`COALESCE(SUM(${expenses.amount}), 0)::numeric`,
      })
      .from(expenses)
      .innerJoin(budgets, eq(expenses.budgetId, budgets.id))

    const totalSpent = Number(totalSpentResult[0]?.total || 0)

    // Get total additional allocations
    const totalAdditionalResult = await db
      .select({
        total: sqlExpr`COALESCE(SUM(${additionalAllocations.amount}), 0)::numeric`,
      })
      .from(additionalAllocations)
      .innerJoin(budgets, eq(additionalAllocations.originalBudgetId, budgets.id))

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
