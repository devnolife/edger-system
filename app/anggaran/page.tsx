"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format-rupiah"
import { Edit, Eye, Plus, Search, Trash } from "lucide-react"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { getBudgets, getBudgetById, getBudgetSummary, type Budget } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useBudgetUpdates } from "@/hooks/use-budget-updates"
import { getExpensesByBudgetId } from "@/app/actions/expense-actions"
import { CreateBudgetDialog } from "./create-budget-dialog"
import { BudgetDetailsDialog } from "./budget-details-dialog"
import { EditBudgetDialog } from "./edit-budget-dialog"
import { DeleteBudgetDialog } from "./delete-budget-dialog"

export default function Anggaran() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budgetId")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalAdditional: 0,
    totalAvailable: 0,
  })
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [budgetExpenses, setBudgetExpenses] = useState<
    Array<{
      id: string
      description: string
      amount: number
      date: string
      submittedBy: string
    }>
  >([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)

  // Use the budget updates hook
  const { lastUpdate } = useBudgetUpdates((event) => {
    // Trigger a refresh when a budget update is received
    setRefreshTrigger((prev) => prev + 1)

    // If the updated budget is the currently selected budget, show a visual indicator
    if (selectedBudget && event.budgetId === selectedBudget.id) {
      // Update the selected budget with the new expense
      setSelectedBudget((prev) => {
        if (!prev) return null
        return {
          ...prev,
          spentAmount: prev.spentAmount + event.expenseAmount,
          availableAmount: prev.availableAmount - event.expenseAmount,
        }
      })
    }
  })

  // Function to refresh budget data
  const refreshBudgetData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch budgets
      const budgetsResult = await getBudgets()
      if (budgetsResult.success) {
        setBudgets(budgetsResult.budgets)
      } else {
        toast({
          title: "Error",
          description: budgetsResult.error || "Failed to fetch budgets",
          variant: "destructive",
        })
      }

      // Fetch summary
      const summaryResult = await getBudgetSummary()
      if (summaryResult.success) {
        setSummary(summaryResult.summary)
      }

      // If there's a selected budget, refresh its details
      if (selectedBudget) {
        const budgetResult = await getBudgetById(selectedBudget.id)
        if (budgetResult.success) {
          setSelectedBudget(budgetResult.budget)
        }
      }
    } catch (error) {
      console.error("Error refreshing budget data:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while refreshing budget data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedBudget, toast])

  // Fetch data on component mount and when refreshTrigger changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch budgets
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets)
        } else {
          toast({
            title: "Error",
            description: budgetsResult.error || "Failed to fetch budgets",
            variant: "destructive",
          })
        }

        // Fetch summary
        const summaryResult = await getBudgetSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // If there's a budget ID in the URL, open its details
        if (budgetIdParam) {
          const budget = budgetsResult.success ? budgetsResult.budgets.find((b) => b.id === budgetIdParam) : null

          if (budget) {
            openBudgetDetails(budget)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, budgetIdParam, refreshTrigger])

  // Filter budgets based on search
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) || budget.id.includes(searchTerm)
    return matchesSearch
  })

  // Check if a budget was recently updated
  const isBudgetRecentlyUpdated = (budgetId: string) => {
    return lastUpdate && lastUpdate.budgetId === budgetId
  }

  const canManageBudgets = role === "superadmin" || role === "admin"

  // Open budget details
  const openBudgetDetails = async (budget: Budget) => {
    setIsLoadingDetails(true)
    setSelectedBudget(budget) // Set initial data from the list
    setIsDetailsDialogOpen(true)
    setBudgetExpenses([]) // Reset expenses when opening a new budget

    try {
      // Add a small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Fetch budget details
      const result = await getBudgetById(budget.id)
      if (result.success) {
        setSelectedBudget(result.budget)

        // After fetching budget details, fetch associated expenses
        setIsLoadingExpenses(true)
        const expensesResult = await getExpensesByBudgetId(budget.id)
        if (expensesResult.success) {
          setBudgetExpenses(expensesResult.expenses)
        } else {
          toast({
            title: "Warning",
            description: "Could not load expense details. Showing limited information.",
            variant: "default",
          })
        }
      } else {
        // If there's an error, we'll still show the dialog with the basic data we have
        toast({
          title: "Warning",
          description: "Could not load complete budget details. Showing limited information.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error fetching budget details:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading details",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetails(false)
      setIsLoadingExpenses(false)
    }
  }

  // Open edit budget dialog
  const openEditBudget = async (budget: Budget) => {
    setSelectedBudget(budget)
    setIsEditDialogOpen(true)
  }

  // Open delete budget dialog
  const openDeleteBudget = async (budget: Budget) => {
    setSelectedBudget(budget)
    setIsDeleteDialogOpen(true)
  }

  // Handle budget creation success
  const handleBudgetActionSuccess = () => {
    refreshBudgetData()
  }

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

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      {/* Header section */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Manajemen Anggaran
          </h2>
          <p className="text-muted-foreground">Buat dan kelola anggaran untuk berbagai kebutuhan</p>
        </div>
        {canManageBudgets && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="rounded-full animated-gradient-button text-white"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Anggaran Baru
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Create Budget Dialog */}
      <CreateBudgetDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleBudgetActionSuccess}
        userName={user?.name || "Unknown User"}
      />

      {/* Budget Details Dialog */}
      <BudgetDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        budget={
          selectedBudget || {
            id: "",
            name: "",
            amount: 0,
            startDate: "",
            createdBy: "",
            createdAt: "",
            availableAmount: 0,
            spentAmount: 0,
          }
        }
        expenses={budgetExpenses}
        isLoading={isLoadingDetails}
        isLoadingExpenses={isLoadingExpenses}
        lastUpdate={lastUpdate}
      />

      {/* Edit Budget Dialog */}
      <EditBudgetDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleBudgetActionSuccess}
        budget={selectedBudget}
      />

      {/* Delete Budget Dialog */}
      <DeleteBudgetDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleBudgetActionSuccess}
        budget={selectedBudget}
      />

      {/* Search section */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
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
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-4">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Anggaran</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.totalBudget)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Terpakai</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.totalSpent)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-3 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Alokasi Tambahan</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.totalAdditional)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Sisa Anggaran</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.totalAvailable)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Budget Table */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">ID</TableHead>
                  <TableHead className="font-display">Nama Anggaran</TableHead>
                  <TableHead className="font-display">Tanggal Pembuatan</TableHead>
                  <TableHead className="text-right font-display">Jumlah (Rp)</TableHead>
                  <TableHead className="font-display">Penggunaan</TableHead>
                  <TableHead className="text-right font-display">Sisa (Rp)</TableHead>
                  <TableHead className="text-right font-display">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="bg-white dark:bg-black rounded-b-xl">
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-muted-foreground">Memuat data anggaran...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Tidak ada data anggaran yang ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets.map((budget, index) => {
                    // Calculate percentage spent
                    const percentSpent = budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0

                    // Determine progress color based on percentage
                    const progressColor =
                      percentSpent > 90 ? "bg-red-500" : percentSpent > 70 ? "bg-yellow-500" : "bg-green-600"

                    return (
                      <motion.tr
                        key={budget.id}
                        className={cn(
                          "hover:bg-primary/5 transition-colors",
                          isBudgetRecentlyUpdated(budget.id) ? "bg-green-50 dark:bg-green-900/20" : "",
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <TableCell className="font-medium">{budget.id}</TableCell>
                        <TableCell>
                          {budget.name}
                          {isBudgetRecentlyUpdated(budget.id) && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Baru diperbarui
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{budget.startDate}</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(budget.amount)}</TableCell>
                        <TableCell className="w-40">
                          <div className="space-y-1">
                            <Progress value={percentSpent} className={cn("h-2 rounded-full", progressColor)} />
                            <div className="flex justify-between text-xs">
                              <span>{percentSpent.toFixed(0)}% terpakai</span>
                              <span>{(100 - percentSpent).toFixed(0)}% tersisa</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(budget.availableAmount)}
                          {isBudgetRecentlyUpdated(budget.id) && (
                            <div className="text-xs text-green-600 font-normal">Baru diperbarui</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-8 w-8"
                              onClick={() => openBudgetDetails(budget)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageBudgets && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8"
                                onClick={() => openEditBudget(budget)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {role === "superadmin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8"
                                onClick={() => openDeleteBudget(budget)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
