"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/format-rupiah"
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Budget } from "@/app/actions/budget-actions"

interface BudgetReportCardProps {
  budget: Budget
  additionalAllocations?: {
    id: string
    description: string
    amount: number
    reason: string
  }[]
}

export function BudgetReportCard({ budget, additionalAllocations = [] }: BudgetReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate percentages
  const totalBudget = budget.amount + (budget.additionalAmount || 0)
  const percentSpent = totalBudget > 0 ? (budget.spentAmount / totalBudget) * 100 : 0
  const percentRemaining = 100 - percentSpent

  // Determine progress color based on percentage using new colors
  const progressColor =
    percentSpent > 90
      ? "bg-[#117554]" // Deep teal for critical
      : percentSpent > 70
        ? "bg-[#FFEB00]" // Bright yellow for warning
        : "bg-[#6EC207]" // Vibrant green for good

  // Calculate total additional allocations
  const totalAdditional = additionalAllocations.reduce((sum, allocation) => sum + allocation.amount, 0)

  return (
    <Card className="overflow-hidden rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-display text-xl">{budget.name}</CardTitle>
            <CardDescription>ID: {budget.id}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Anggaran Awal</p>
              <p className="text-lg font-semibold">{formatRupiah(budget.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Terpakai</p>
              <p className="text-lg font-semibold">{formatRupiah(budget.spentAmount)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Penggunaan Anggaran</span>
              <span>{percentSpent.toFixed(1)}%</span>
            </div>
            <Progress value={percentSpent} className={`h-2.5 rounded-full ${progressColor}`} />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Sisa: {formatRupiah(budget.availableAmount)}</span>
              <span className="text-muted-foreground">{percentRemaining.toFixed(1)}% tersisa</span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-2"
              >
                {/* Additional allocations section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <PlusCircle className="h-3.5 w-3.5 text-[#4379F2]" /> {/* Using bright blue */}
                    Alokasi Tambahan
                  </h4>

                  {additionalAllocations.length > 0 ? (
                    <div className="space-y-2">
                      {additionalAllocations.map((allocation, index) => (
                        <div
                          key={allocation.id}
                          className="p-3 rounded-lg bg-[#4379F2]/5 border border-[#4379F2]/10" /* Using bright blue */
                        >
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{allocation.description}</p>
                              <p className="text-xs text-muted-foreground">{allocation.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatRupiah(allocation.amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Total Alokasi Tambahan</span>
                        <span className="font-medium">{formatRupiah(totalAdditional)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada alokasi tambahan</p>
                  )}
                </div>

                {/* Summary section */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total Anggaran Keseluruhan</span>
                    <span>{formatRupiah(totalBudget)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
