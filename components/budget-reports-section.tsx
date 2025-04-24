"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, BarChart3 } from "lucide-react"
import { BudgetReportCard } from "@/components/budget-report-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getBudgets } from "@/app/actions/budget-actions"
import { getAdditionalAllocations } from "@/app/actions/allocation-actions"
import { formatRupiah } from "@/lib/format-rupiah"
import { motion } from "framer-motion"

export function BudgetReportsSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [budgets, setBudgets] = useState<any[]>([])
  const [allocations, setAllocations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [error, setError] = useState<string | null>(null)

  // Fetch budgets and allocations
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch budgets
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets)
        } else {
          setError("Failed to fetch budgets")
        }

        // Fetch allocations
        const allocationsResult = await getAdditionalAllocations()
        if (allocationsResult.success) {
          setAllocations(allocationsResult.allocations)
        } else {
          setError("Failed to fetch allocations")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter budgets based on search term
  const filteredBudgets = budgets.filter(
    (budget) =>
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort budgets
  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "amount":
        return b.amount - a.amount
      case "spent":
        return b.spentAmount - a.spentAmount
      case "available":
        return b.availableAmount - a.availableAmount
      default:
        return 0
    }
  })

  // Group allocations by budget ID
  const allocationsByBudget = allocations.reduce(
    (acc, allocation) => {
      const budgetId = allocation.originalBudgetId
      if (!acc[budgetId]) {
        acc[budgetId] = []
      }
      acc[budgetId].push(allocation)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Calculate totals
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
  const totalAvailable = budgets.reduce((sum, budget) => sum + budget.availableAmount, 0)
  const totalAdditional = allocations.reduce((sum, allocation) => sum + allocation.amount, 0)

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Memuat data anggaran..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">{error}</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-md rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Anggaran</p>
            <p className="text-2xl font-bold">{formatRupiah(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-none shadow-md rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Terpakai</p>
            <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-none shadow-md rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tersisa</p>
            <p className="text-2xl font-bold">{formatRupiah(totalAvailable)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-none shadow-md rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Alokasi Tambahan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalAdditional)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and filter */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari anggaran..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] rounded-full border-primary/20">
              <SelectValue placeholder="Urutkan berdasarkan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="amount">Jumlah Anggaran</SelectItem>
              <SelectItem value="spent">Jumlah Terpakai</SelectItem>
              <SelectItem value="available">Sisa Anggaran</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-full border-primary/20">
            <Download className="mr-2 h-4 w-4 text-primary" />
            Ekspor
          </Button>
          <Button variant="outline" className="rounded-full border-primary/20">
            <BarChart3 className="mr-2 h-4 w-4 text-primary" />
            Grafik
          </Button>
        </div>
      </motion.div>

      {/* Budget cards */}
      {sortedBudgets.length === 0 ? (
        <motion.div variants={item} className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada anggaran yang ditemukan</p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedBudgets.map((budget) => (
            <motion.div key={budget.id} variants={item}>
              <BudgetReportCard budget={budget} additionalAllocations={allocationsByBudget[budget.id] || []} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
