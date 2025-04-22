"use client"

import { motion } from "framer-motion"
import { formatRupiah } from "@/lib/format-rupiah"

interface BudgetUpdateIndicatorProps {
  budgetId: string
  lastUpdateBudgetId: string | null
  expenseAmount: number
  className?: string
}

export function BudgetUpdateIndicator({
  budgetId,
  lastUpdateBudgetId,
  expenseAmount,
  className,
}: BudgetUpdateIndicatorProps) {
  // Only show the indicator if the budget ID matches the last update
  if (!lastUpdateBudgetId || lastUpdateBudgetId !== budgetId) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`text-xs text-green-600 font-medium ${className}`}
    >
      Dikurangi {formatRupiah(expenseAmount)} baru-baru ini
    </motion.div>
  )
}
