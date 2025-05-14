"use server"

import { prisma } from "@/lib/prisma"
import { DashboardSummary } from "./dashboard-actions"

// Supervisor summary with additional data
export interface SupervisorSummary extends DashboardSummary {
  activeOperatorsCount: number
  totalActivities: number
  lastUpdateTime: string
}

// Activity type for tracking system events
export interface Activity {
  id: string
  type: "expense" | "budget" | "additionalAllocation"
  description: string
  amount?: number
  date: string
  operator: string
  status: string
}

/**
 * Get comprehensive data for the supervisor dashboard
 */
export async function getSupervisorData(): Promise<{
  success: boolean
  summary?: SupervisorSummary
  activities?: Activity[]
  error?: string
}> {
  try {
    // Get all expenses
    const expenses = await prisma.expense.findMany({
      include: { budget: true },
      orderBy: { submitted_at: "desc" },
    })

    // Get all budgets
    const budgets = await prisma.budget.findMany({
      orderBy: { created_at: "desc" },
    })

    // Get all additional allocations
    const additionalAllocations = await prisma.additionalAllocation.findMany({
      orderBy: { request_date: "desc" },
    })

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Get current date information
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear()

    // Get expenses from current month
    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = expense.date
      return expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Get expenses from previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const previousMonthExpenses = expenses.filter((expense) => {
      const expenseDate = expense.date
      return expenseDate.getMonth() + 1 === previousMonth && expenseDate.getFullYear() === previousYear
    })

    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Calculate expense growth percentage
    let expenseGrowth = 0
    if (previousMonthTotal > 0) {
      expenseGrowth = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    }

    // Create activities list with proper typing
    const formattedActivities: Activity[] = [
      // Map expenses to activities
      ...expenses.map(expense => ({
        id: expense.id,
        type: "expense" as const,
        description: expense.description,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split("T")[0],
        operator: expense.submitted_by,
        status: expense.additional_allocation_id ? "Dengan Alokasi Tambahan" : "Reguler"
      })),

      // Map budgets to activities
      ...budgets.map(budget => ({
        id: budget.id,
        type: "budget" as const,
        description: budget.name,
        amount: Number(budget.amount),
        date: budget.start_date.toISOString().split("T")[0],
        operator: budget.created_by,
        status: "Anggaran"
      })),

      // Map additional allocations to activities
      ...additionalAllocations.map(allocation => ({
        id: allocation.id,
        type: "additionalAllocation" as const,
        description: allocation.description,
        amount: Number(allocation.amount),
        date: allocation.request_date.toISOString().split("T")[0],
        operator: allocation.requested_by,
        status: allocation.approved_at ? "Disetujui" : "Menunggu Persetujuan"
      }))
    ];

    // Sort by date (newest first)
    formattedActivities.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Get unique operators
    const uniqueOperators = new Set<string>();
    formattedActivities.forEach(activity => {
      if (activity.operator) {
        uniqueOperators.add(activity.operator);
      }
    });

    const summary: SupervisorSummary = {
      totalExpenses,
      expenseGrowth,
      totalBudgetItems: budgets.length,
      totalAdditionalBudgetItems: additionalAllocations.length,
      activeOperatorsCount: uniqueOperators.size,
      totalActivities: formattedActivities.length,
      lastUpdateTime: new Date().toISOString()
    };

    return {
      success: true,
      summary,
      activities: formattedActivities
    };
  } catch (error) {
    console.error("Error fetching supervisor data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

/**
 * Get activity data filtered by type
 */
export async function getFilteredActivities(type?: "expense" | "budget" | "additionalAllocation"): Promise<{
  success: boolean;
  activities?: Activity[];
  error?: string;
}> {
  try {
    const result = await getSupervisorData();

    if (!result.success || !result.activities) {
      return {
        success: false,
        error: result.error || "Failed to fetch activities"
      };
    }

    let filteredActivities = result.activities;

    if (type) {
      filteredActivities = result.activities.filter(activity => activity.type === type);
    }

    return {
      success: true,
      activities: filteredActivities
    };
  } catch (error) {
    console.error("Error fetching filtered activities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
} 
