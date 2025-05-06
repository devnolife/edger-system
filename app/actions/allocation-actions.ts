"use server"

import { prisma, generateId, formatDateForDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@prisma/client"

// Define types
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

// Update validation schema for editing
const updateAllocationSchema = z.object({
  id: z.string().min(1, "Allocation ID is required"),
  originalBudgetId: z.string().min(1, "Budget ID is required"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  amount: z.number().positive("Amount must be positive"),
  requestDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
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

    // Create the allocation using Prisma
    await prisma.additionalAllocation.create({
      data: {
        id,
        originalBudgetId: validatedData.originalBudgetId,
        description: validatedData.description,
        reason: validatedData.reason,
        amount: new Prisma.Decimal(validatedData.amount),
        requestDate: formatDateForDB(validatedData.requestDate),
        requestedBy: validatedData.requestedBy,
        relatedExpenseId: validatedData.relatedExpenseId,
        approvedBy: validatedData.requestedBy,
        approvedAt: new Date(),
      },
    })

    // If this allocation is related to an expense, update the expense
    if (validatedData.relatedExpenseId) {
      await prisma.expense.update({
        where: { id: validatedData.relatedExpenseId },
        data: { additionalAllocationId: id },
      })
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

// Update an existing additional allocation
export async function updateAdditionalAllocation(formData: FormData) {
  try {
    // Extract and validate data
    const id = formData.get("id") as string
    const originalBudgetId = formData.get("originalBudgetId") as string
    const description = formData.get("description") as string
    const reason = formData.get("reason") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const requestDate = formData.get("requestDate") as string

    // Validate data
    const validatedData = updateAllocationSchema.parse({
      id,
      originalBudgetId,
      description,
      reason,
      amount,
      requestDate,
    })

    // Check if the allocation exists
    const existingAllocation = await prisma.additionalAllocation.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingAllocation) {
      return {
        success: false,
        error: "Additional allocation not found",
      }
    }

    // Check if there are any expenses using this allocation
    const expenses = await prisma.expense.findMany({
      where: { additionalAllocationId: validatedData.id },
    })

    const spentAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // If the new amount is less than the spent amount, return an error
    if (validatedData.amount < spentAmount) {
      return {
        success: false,
        error: `Cannot reduce allocation amount below spent amount (${spentAmount})`,
      }
    }

    // Update the allocation
    await prisma.additionalAllocation.update({
      where: { id: validatedData.id },
      data: {
        originalBudgetId: validatedData.originalBudgetId,
        description: validatedData.description,
        reason: validatedData.reason,
        amount: new Prisma.Decimal(validatedData.amount),
        requestDate: formatDateForDB(validatedData.requestDate),
      },
    })

    // Revalidate the allocations page to reflect the changes
    revalidatePath("/anggaran-tambahan")
    // Also revalidate the budget page to reflect the updated budget amounts
    revalidatePath("/anggaran")

    return { success: true }
  } catch (error) {
    console.error("Error updating additional allocation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Delete an additional allocation
export async function deleteAdditionalAllocation(id: string) {
  try {
    // Check if the allocation exists
    const existingAllocation = await prisma.additionalAllocation.findUnique({
      where: { id },
    })

    if (!existingAllocation) {
      return {
        success: false,
        error: "Additional allocation not found",
      }
    }

    // Check if there are any expenses using this allocation
    const expensesCount = await prisma.expense.count({
      where: { additionalAllocationId: id },
    })

    if (expensesCount > 0) {
      // Update expenses to remove the allocation reference
      await prisma.expense.updateMany({
        where: { additionalAllocationId: id },
        data: { additionalAllocationId: null },
      })
    }

    // Delete the allocation
    await prisma.additionalAllocation.delete({
      where: { id },
    })

    // Revalidate the allocations page to reflect the changes
    revalidatePath("/anggaran-tambahan")
    // Also revalidate the budget page to reflect the updated budget amounts
    revalidatePath("/anggaran")

    return { success: true }
  } catch (error) {
    console.error("Error deleting additional allocation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Get all additional allocations
export async function getAdditionalAllocations() {
  try {
    // Get all allocations with their related budget
    const allocations = await prisma.additionalAllocation.findMany({
      include: {
        originalBudget: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
    })

    // If no allocations, return empty array
    if (allocations.length === 0) {
      return { success: true, allocations: [] }
    }

    // Get all allocation IDs
    const allocationIds = allocations.map((allocation) => allocation.id)

    // Get all expenses related to these allocations
    const expenses = await prisma.expense.findMany({
      where: {
        additionalAllocationId: {
          in: allocationIds,
        },
      },
    })

    // Create a map of allocation_id to spent amount
    const spentAmountMap = new Map<string, number>()
    expenses.forEach((expense) => {
      const allocationId = expense.additionalAllocationId
      if (allocationId) {
        const currentAmount = spentAmountMap.get(allocationId) || 0
        spentAmountMap.set(allocationId, currentAmount + Number(expense.amount))
      }
    })

    // Map the allocations with calculated fields
    const allocationsWithCalculatedFields = allocations.map((allocation) => {
      const spentAmount = spentAmountMap.get(allocation.id) || 0
      const availableAmount = Number(allocation.amount) - spentAmount

      return {
        id: allocation.id,
        originalBudgetId: allocation.originalBudgetId,
        originalBudgetName: allocation.originalBudget.name,
        description: allocation.description,
        reason: allocation.reason,
        amount: Number(allocation.amount),
        requestDate: allocation.requestDate.toISOString().split("T")[0],
        requestedBy: allocation.requestedBy,
        requestedAt: allocation.requestedAt.toISOString(),
        approvedBy: allocation.approvedBy || undefined,
        approvedAt: allocation.approvedAt?.toISOString() || undefined,
        relatedExpenseId: allocation.relatedExpenseId || undefined,
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

// Get a single additional allocation by ID
export async function getAdditionalAllocationById(id: string) {
  try {
    // Get the allocation with its related budget
    const allocation = await prisma.additionalAllocation.findUnique({
      where: { id },
      include: {
        originalBudget: true,
      },
    })

    if (!allocation) {
      return { success: false, error: "Additional allocation not found" }
    }

    // Calculate spent amount from expenses that use this allocation
    const expenses = await prisma.expense.findMany({
      where: { additionalAllocationId: id },
    })

    const spentAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate available amount
    const availableAmount = Number(allocation.amount) - spentAmount

    // If there's a related expense, get its details
    let relatedExpense = null
    if (allocation.relatedExpenseId) {
      const expense = await prisma.expense.findUnique({
        where: { id: allocation.relatedExpenseId },
      })

      if (expense) {
        relatedExpense = {
          id: expense.id,
          description: expense.description,
          amount: Number(expense.amount),
        }
      }
    }

    return {
      success: true,
      allocation: {
        id: allocation.id,
        originalBudgetId: allocation.originalBudgetId,
        originalBudgetName: allocation.originalBudget.name,
        description: allocation.description,
        reason: allocation.reason,
        amount: Number(allocation.amount),
        requestDate: allocation.requestDate.toISOString().split("T")[0],
        requestedBy: allocation.requestedBy,
        requestedAt: allocation.requestedAt.toISOString(),
        approvedBy: allocation.approvedBy || undefined,
        approvedAt: allocation.approvedAt?.toISOString() || undefined,
        relatedExpenseId: allocation.relatedExpenseId || undefined,
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

// Get allocation summary
export async function getAllocationSummary() {
  try {
    // Get all allocations
    const allocations = await prisma.additionalAllocation.findMany()

    // Calculate total amount
    const total = allocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0)

    // Get count of allocations
    const count = allocations.length

    return {
      success: true,
      summary: {
        total,
        count,
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
