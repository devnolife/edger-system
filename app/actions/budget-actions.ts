"use server"

import { prisma, generateId, formatDateForDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"

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

// Create a new budget
export async function createBudget(formData: FormData) {
  try {
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
    const formattedDate = formatDateForDB(creationDate)

    // Create budget using Prisma
    await prisma.budget.create({
      data: {
        id,
        name,
        amount: new Prisma.Decimal(amount),
        startDate: formattedDate,
        description,
        createdBy,
      },
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
    // Get all budgets with their expenses
    const budgets = await prisma.budget.findMany({
      include: {
        expenses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format the budgets with calculated fields
    const formattedBudgets: Budget[] = budgets.map((budget) => {
      const spentAmount = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

      return {
        id: budget.id,
        name: budget.name,
        amount: Number(budget.amount),
        startDate: budget.startDate.toLocaleDateString("id-ID"),
        createdBy: budget.createdBy,
        createdAt: budget.createdAt.toLocaleDateString("id-ID"),
        spentAmount,
        availableAmount: Number(budget.amount) - spentAmount,
        description: budget.description || undefined,
      }
    })

    return { success: true, budgets: formattedBudgets }
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      budgets: [],
    }
  }
}

// Get a single budget by ID with calculated fields
export async function getBudgetById(id: string) {
  try {
    // Get the budget with its expenses and additional allocations
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        expenses: true,
        additionalAllocations: true,
      },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    // Calculate spent amount from expenses
    const spentAmount = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate additional allocations
    const additionalAmount = budget.additionalAllocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    )

    // Calculate available amount
    const availableAmount = Number(budget.amount) + additionalAmount - spentAmount

    return {
      success: true,
      budget: {
        id: budget.id,
        name: budget.name,
        amount: Number(budget.amount),
        startDate: budget.startDate.toLocaleDateString("id-ID"),
        description: budget.description || undefined,
        createdBy: budget.createdBy,
        createdAt: budget.createdAt.toLocaleDateString("id-ID"),
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

    // Update budget using Prisma
    await prisma.budget.update({
      where: { id },
      data: {
        name: validatedData.name,
        amount: new Prisma.Decimal(validatedData.amount),
        description: validatedData.description,
        updatedAt: new Date(),
      },
    })

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
    const expensesCount = await prisma.expense.count({
      where: { budgetId: id },
    })

    if (expensesCount > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated expenses. Please delete the expenses first.",
      }
    }

    // Check if there are any additional allocations associated with this budget
    const allocationsCount = await prisma.additionalAllocation.count({
      where: { originalBudgetId: id },
    })

    if (allocationsCount > 0) {
      return {
        success: false,
        error: "Cannot delete budget with associated additional allocations. Please delete the allocations first.",
      }
    }

    // Delete the budget
    await prisma.budget.delete({
      where: { id },
    })

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
    const result = await prisma.$transaction(async (tx) => {
      // First delete all expenses associated with this budget
      const deletedExpenses = await tx.expense.deleteMany({
        where: { budgetId: id },
      })

      // Then delete any additional allocations associated with this budget
      const deletedAllocations = await tx.additionalAllocation.deleteMany({
        where: { originalBudgetId: id },
      })

      // Finally delete the budget itself
      const deletedBudget = await tx.budget.delete({
        where: { id },
      })

      return {
        deletedExpenses: deletedExpenses.count,
        deletedAllocations: deletedAllocations.count,
      }
    })

    // Revalidate the budgets page to reflect the changes
    revalidatePath("/anggaran")
    revalidatePath("/pengeluaran")

    return {
      success: true,
      deletedExpenses: result.deletedExpenses,
      deletedAllocations: result.deletedAllocations,
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
    // Get all budgets with their expenses and additional allocations
    const budgets = await prisma.budget.findMany({
      include: {
        expenses: true,
        additionalAllocations: true,
      },
    })

    // Calculate summary values
    let totalBudget = 0
    let totalSpent = 0
    let totalAdditional = 0

    budgets.forEach((budget) => {
      totalBudget += Number(budget.amount)

      budget.expenses.forEach((expense) => {
        totalSpent += Number(expense.amount)
      })

      budget.additionalAllocations.forEach((allocation) => {
        totalAdditional += Number(allocation.amount)
      })
    })

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
