import { pgTable, serial, varchar, decimal, timestamp, text, date, pgEnum } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enum untuk status
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected", "active"])

// Tabel Budgets (Anggaran)
export const budgets = pgTable("budgets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  description: text("description"),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  lastExpenseAmount: decimal("last_expense_amount", { precision: 15, scale: 2 }),
  lastExpenseDate: timestamp("last_expense_date"),
})

// Tabel Expenses (Pengeluaran)
export const expenses = pgTable("expenses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  budgetId: varchar("budget_id", { length: 255 })
    .notNull()
    .references(() => budgets.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: date("date").notNull(),
  submittedBy: varchar("submitted_by", { length: 255 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  notes: text("notes"),
  additionalAllocationId: varchar("additional_allocation_id", { length: 255 }),
  imageUrl: text("image_url"),
})

// Tabel Additional Allocations (Anggaran Tambahan)
export const additionalAllocations = pgTable("additional_allocations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  originalBudgetId: varchar("original_budget_id", { length: 255 })
    .notNull()
    .references(() => budgets.id),
  description: text("description").notNull(),
  reason: text("reason").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  requestDate: date("request_date").notNull(),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  relatedExpenseId: varchar("related_expense_id", { length: 255 }),
})

// Tabel Budget Usage History (Riwayat Penggunaan Anggaran)
export const budgetUsageHistory = pgTable("budget_usage_history", {
  id: serial("id").primaryKey(),
  budgetId: varchar("budget_id", { length: 255 })
    .notNull()
    .references(() => budgets.id),
  expenseId: varchar("expense_id", { length: 255 })
    .notNull()
    .references(() => expenses.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
})

// Definisi relasi
export const budgetsRelations = relations(budgets, ({ many }) => ({
  expenses: many(expenses),
  additionalAllocations: many(additionalAllocations),
  usageHistory: many(budgetUsageHistory),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  budget: one(budgets, {
    fields: [expenses.budgetId],
    references: [budgets.id],
  }),
  additionalAllocation: one(additionalAllocations, {
    fields: [expenses.additionalAllocationId],
    references: [additionalAllocations.id],
  }),
}))

export const additionalAllocationsRelations = relations(additionalAllocations, ({ one }) => ({
  originalBudget: one(budgets, {
    fields: [additionalAllocations.originalBudgetId],
    references: [budgets.id],
  }),
  relatedExpense: one(expenses, {
    fields: [additionalAllocations.relatedExpenseId],
    references: [expenses.id],
  }),
}))

export const budgetUsageHistoryRelations = relations(budgetUsageHistory, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetUsageHistory.budgetId],
    references: [budgets.id],
  }),
  expense: one(expenses, {
    fields: [budgetUsageHistory.expenseId],
    references: [expenses.id],
  }),
}))
