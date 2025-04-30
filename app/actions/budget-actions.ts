"use server"

import { sql, generateId, formatDateForSQL, executeQueryWithRetry } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Add import for the new db fallback utilities
import { withDbErrorHandling } from "@/lib/db-fallback"

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

// Function to check if the budgets table exists
async function ensureBudgetsTableExists() {
  try {
    // Check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'budgets'
      ) as exists
    `

    if (!tableExists[0]?.exists) {
      // Create the table if it doesn't exist
      await sql`
        CREATE TABLE budgets (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          start_date DATE NOT NULL,
          description TEXT,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )
      `
      console.log("Created budgets table")
    }

    return true
  } catch (error) {
    console.error("Error checking/creating budgets table:", error)
    return false
  }
}

// Function to check if the status column exists in the budgets table
async function checkStatusColumnExists() {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'budgets' AND column_name = 'status'
      ) as exists
    `
    return result[0]?.exists || false
  } catch (error) {
    console.error("Error checking status column:", error)
    return true // Assume it exists if we can't check, to be safe
  }
}

// Create a new budget - now handling the status column if it exists
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

    // Check if the status column exists
    const statusColumnExists = await checkStatusColumnExists()

    // Log the data being inserted for debugging
    console.log("Inserting budget:", {
      id,
      name,
      amount,
      startDate: formattedDate,
      description,
      createdBy,
      statusColumnExists,
    })

    // Use a transaction to ensure atomicity
    try {
      // Begin transaction
      await sql`BEGIN`

      // Insert into database - with or without status field based on column existence
      if (statusColumnExists) {
        await sql`
          INSERT INTO budgets (
            id, name, amount, start_date, 
            description, created_by, status
          ) VALUES (
            ${id}, ${name}, ${amount}, 
            ${formattedDate}, 
            ${description}, ${createdBy}, 'active'
          )
        `
      } else {
        await sql`
          INSERT INTO budgets (
            id, name, amount, start_date, 
            description, created_by
          ) VALUES (
            ${id}, ${name}, ${amount}, 
            ${formattedDate}, 
            ${description}, ${createdBy}
          )
        `
      }

      // Commit transaction
      await sql`COMMIT`
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`
      console.error("SQL Error during budget creation:", error)

      // Check for specific error types
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes("duplicate key")) {
        return {
          success: false,
          error: "A budget with this ID already exists. Please try again.",
        }
      }

      if (errorMessage.includes("violates not-null constraint")) {
        return {
          success: false,
          error: "Missing required field. Please ensure all required fields are filled.",
        }
      }

      throw error
    }

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

// Update the getBudgets function to use the fallback mechanism
// Find the getBudgets function and replace it with:

export async function getBudgets() {
  const result = await withDbErrorHandling(async () => {
    const budgets = await sql`
      SELECT 
        b.id, 
        b.name, 
        b.amount, 
        TO_CHAR(b.start_date, 'DD-MM-YYYY') as start_date,
        b.created_by,
        TO_CHAR(b.created_at, 'DD-MM-YYYY') as created_at,
        COALESCE(SUM(e.amount), 0) as spent_amount
      FROM 
        budgets b
      LEFT JOIN 
        expenses e ON b.id = e.budget_id
      GROUP BY 
        b.id, b.name, b.amount, b.start_date, b.created_by, b.created_at
      ORDER BY 
        b.created_at DESC
    `

    return budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      amount: Number(budget.amount),
      startDate: budget.start_date,
      createdBy: budget.created_by,
      createdAt: budget.created_at,
      spentAmount: Number(budget.spent_amount),
      availableAmount: Number(budget.amount) - Number(budget.spent_amount),
    }))
  }, "Failed to fetch budgets")

  if (!result.success) {
    return { success: false, error: result.error, budgets: [] }
  }

  return { success: true, budgets: result.data || [] }
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

// Delete a budget along with all associated expenses
export async function deleteBudgetWithExpenses(id: string) {
  try {
    // Use a transaction to ensure atomicity
    await sql`BEGIN`

    try {
      // First delete all expenses associated with this budget
      const deleteExpensesResult = await sql`
        DELETE FROM expenses WHERE budget_id = ${id}
      `

      console.log(`Deleted ${deleteExpensesResult.count} expenses associated with budget ${id}`)

      // Then delete any additional allocations associated with this budget
      const deleteAllocationsResult = await sql`
        DELETE FROM additional_allocations WHERE original_budget_id = ${id}
      `

      console.log(`Deleted ${deleteAllocationsResult.count} allocations associated with budget ${id}`)

      // Finally delete the budget itself
      const deleteBudgetResult = await sql`
        DELETE FROM budgets WHERE id = ${id}
      `

      if (deleteBudgetResult.count === 0) {
        await sql`ROLLBACK`
        return {
          success: false,
          error: "Budget not found",
        }
      }

      // Commit the transaction
      await sql`COMMIT`

      // Revalidate the budgets page to reflect the changes
      revalidatePath("/anggaran")
      revalidatePath("/pengeluaran")

      return {
        success: true,
        deletedExpenses: deleteExpensesResult.count,
        deletedAllocations: deleteAllocationsResult.count,
      }
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error deleting budget with expenses:", error)
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
