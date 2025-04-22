// Budget and expense types
export type BudgetStatus = "active" | "completed" | "draft"
export type ExpenseStatus = "pending" | "approved" | "rejected"
export type AllocationStatus = "pending" | "approved" | "rejected"

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
  availableAmount: number // Calculated field: amount - sum of expenses
  spentAmount: number // Calculated field: sum of expenses
}

export interface Expense {
  id: string
  budgetId: string
  description: string
  amount: number
  date: string
  department: string
  status: ExpenseStatus
  submittedBy: string
  submittedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  additionalAllocationId?: string // Reference to additional allocation if needed
}

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
  relatedExpenseId?: string // If created automatically due to expense
  availableAmount: number // Calculated field
  spentAmount: number // Calculated field
}

// Budget Service
export class BudgetService {
  // Generate unique ID for each entity type
  static generateId(prefix: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}-${year}-${random}`
  }

  // Check if expense exceeds budget and handle allocation if needed
  static async checkBudgetAllocation(
    budgetId: string,
    expenseAmount: number,
  ): Promise<{
    needsAllocation: boolean
    shortageAmount: number
    budgetName: string
  }> {
    // In a real implementation, this would query the database
    // This is a mock implementation
    const budget = await this.getBudgetById(budgetId)

    if (!budget) {
      throw new Error("Budget not found")
    }

    const availableAmount = budget.availableAmount

    if (expenseAmount > availableAmount) {
      return {
        needsAllocation: true,
        shortageAmount: expenseAmount - availableAmount,
        budgetName: budget.name,
      }
    }

    return {
      needsAllocation: false,
      shortageAmount: 0,
      budgetName: budget.name,
    }
  }

  // Create an additional allocation
  static async createAdditionalAllocation(
    originalBudgetId: string,
    amount: number,
    reason: string,
    description: string,
    requestedBy: string,
    relatedExpenseId?: string,
  ): Promise<AdditionalAllocation> {
    const allocationId = this.generateId("ADD")

    const allocation: AdditionalAllocation = {
      id: allocationId,
      originalBudgetId,
      description,
      reason,
      amount,
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending",
      requestedBy,
      requestedAt: new Date().toISOString(),
      relatedExpenseId,
      availableAmount: amount,
      spentAmount: 0,
    }

    // In a real implementation, save to database

    return allocation
  }

  // Mock implementation to get budget by ID
  static async getBudgetById(id: string): Promise<Budget | null> {
    // In a real implementation, query the database
    // This is a mock implementation that returns a dummy budget
    const mockBudget: Budget = {
      id,
      name: "Sample Budget",
      department: "IT",
      amount: 100000,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      status: "active",
      createdBy: "Admin User",
      createdAt: "2023-01-01T00:00:00Z",
      availableAmount: 60000, // Mock value
      spentAmount: 40000, // Mock value
    }

    return mockBudget
  }

  // Create an expense
  static async createExpense(
    budgetId: string,
    description: string,
    amount: number,
    date: string,
    department: string,
    submittedBy: string,
    notes?: string,
  ): Promise<{
    expense: Expense
    allocation?: AdditionalAllocation
    needsAllocation: boolean
  }> {
    const expenseId = this.generateId("EXP")

    // Check if expense exceeds budget
    const allocationCheck = await this.checkBudgetAllocation(budgetId, amount)

    const expense: Expense = {
      id: expenseId,
      budgetId,
      description,
      amount,
      date,
      department,
      status: "pending",
      submittedBy,
      submittedAt: new Date().toISOString(),
      notes,
    }

    // In a real implementation, save to database

    if (allocationCheck.needsAllocation) {
      return {
        expense,
        needsAllocation: true,
      }
    }

    return {
      expense,
      needsAllocation: false,
    }
  }
}
