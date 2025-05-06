"use server"

import { prisma, generateId, formatDateForDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { updateBudgetCalculations, trackBudgetUsage } from "@/lib/budget-update-service"

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
  imageUrl?: string
}

// Update the validation schema to require imageUrl
const expenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  submittedBy: z.string().min(1, "Submitter is required"),
  notes: z.string().optional(),
  imageUrl: z.string().min(1, "Receipt image is required"),
})

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
      imageUrl,
    })

    // Generate a unique ID
    const id = generateId("EXP")

    // Get the current budget details to check available amount
    const budget = await prisma.budget.findUnique({
      where: { id: validatedData.budgetId },
      include: {
        expenses: true,
      },
    })

    if (!budget) {
      return { success: false, error: "Budget not found" }
    }

    // Calculate available amount
    const spentAmount = budget.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const availableAmount = Number(budget.amount) - spentAmount

    let additionalAllocationId: string | null = null
    let needsAllocation = false

    // Check if the expense exceeds the available budget
    if (validatedData.amount > availableAmount) {
      needsAllocation = true
      const shortageAmount = validatedData.amount - availableAmount

      // Create an additional allocation that is automatically approved
      additionalAllocationId = generateId("ADD")

      await prisma.additionalAllocation.create({
        data: {
          id: additionalAllocationId,
          original_budget_id: validatedData.budgetId,
          description: `Alokasi tambahan untuk: ${validatedData.description}`,
          reason: "Pengeluaran melebihi anggaran yang tersedia",
          amount: new Prisma.Decimal(shortageAmount),
          request_date: formatDateForDB(validatedData.date),
          requested_by: validatedData.submittedBy,
          approved_by: validatedData.submittedBy,
          approved_at: new Date(),
          related_expense_id: id,
        },
      })
    }

    // Insert the expense record
    await prisma.expense.create({
      data: {
        id,
        budget_id: validatedData.budgetId,
        description: validatedData.description,
        amount: new Prisma.Decimal(validatedData.amount),
        date: formatDateForDB(validatedData.date),
        submitted_by: validatedData.submittedBy,
        notes: validatedData.notes,
        additional_allocation_id: additionalAllocationId,
        image_url: validatedData.imageUrl,
      },
    })

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

// Update the getExpenses function to include imageUrl
export async function getExpenses() {
  try {
    // Get all expenses with budget name
    const expenses = await prisma.expense.findMany({
      include: { budget: true },
      orderBy: { submitted_at: "desc" },
    })

    return {
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        budgetId: expense.budget_id,
        budgetName: expense.budget.name,
        description: expense.description,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at.toISOString(),
        notes: expense.notes || undefined,
        additionalAllocationId: expense.additional_allocation_id || undefined,
        imageUrl: expense.image_url || undefined,
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
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
      },
    })

    if (!expense) {
      return { success: false, error: "Expense not found" }
    }

    // If there's an additional allocation, get its details
    let additionalAllocation = null
    if (expense.additional_allocation_id) {
      const allocation = await prisma.additionalAllocation.findUnique({
        where: { id: expense.additional_allocation_id },
      })

      if (allocation) {
        additionalAllocation = {
          id: allocation.id,
          amount: Number(allocation.amount),
          status: "approved", // All allocations are approved
          reason: allocation.reason,
        }
      }
    }

    return {
      success: true,
      expense: {
        id: expense.id,
        budgetId: expense.budget_id,
        budgetName: expense.budget.name,
        description: expense.description,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at.toISOString(),
        notes: expense.notes || undefined,
        additionalAllocationId: expense.additional_allocation_id || undefined,
        additionalAllocation,
        imageUrl: expense.image_url || undefined,
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
    const expenses = await prisma.expense.findMany({
      where: { budget_id: budgetId },
      include: {
        budget: true,
      },
      orderBy: {
        submitted_at: "desc",
      },
    })

    return {
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        budgetId: expense.budget_id,
        budgetName: expense.budget.name,
        description: expense.description,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
        submittedBy: expense.submitted_by,
        submittedAt: expense.submitted_at.toISOString(),
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
    // Get all expenses
    const expenses = await prisma.expense.findMany()

    // Calculate summary values
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate approved (without additional allocation)
    const approved = expenses
      .filter((expense) => !expense.additional_allocation_id)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate with allocation
    const withAllocation = expenses
      .filter((expense) => expense.additional_allocation_id)
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const summary = {
      total,
      approved,
      pending: 0, // All expenses are approved
      withAllocation,
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
