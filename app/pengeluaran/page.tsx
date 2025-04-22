"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Eye, AlertTriangle, Plus, Search } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { formatRupiah, parseRupiah } from "@/lib/format-rupiah"
import {
  getExpenses,
  createExpense,
  getExpenseById,
  getExpenseSummary,
  type Expense,
} from "@/app/actions/expense-actions"
import { getBudgets, getBudgetById } from "@/app/actions/budget-actions"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { emitBudgetUpdate, useBudgetUpdates } from "@/hooks/use-budget-updates"
import { BudgetUpdateIndicator } from "@/components/budget-update-indicator"

export default function Pengeluaran() {
  const { user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budget")

  const [searchTerm, setSearchTerm] = useState("")
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    withAllocation: 0,
  })

  // Form state
  const [budgetId, setBudgetId] = useState(budgetIdParam || "")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Budget information
  const [selectedBudget, setSelectedBudget] = useState<{
    id: string
    name: string
    availableAmount: number
    amount: number
    spentAmount: number
  } | null>(null)

  // Validation state
  const [exceedsBudget, setExceedsBudget] = useState(false)
  const [needsAllocation, setNeedsAllocation] = useState(false)
  const [budgetPercentage, setBudgetPercentage] = useState(0)

  // Use the budget updates hook to listen for updates
  const { lastUpdate } = useBudgetUpdates(
    useCallback(
      (event) => {
        // If the updated budget is the currently selected budget, update it
        if (selectedBudget && event.budgetId === selectedBudget.id) {
          setSelectedBudget((prev) => {
            if (!prev) return null

            // Calculate new values
            const newSpentAmount = prev.spentAmount + event.expenseAmount
            const newAvailableAmount = prev.amount - newSpentAmount
            const newPercentage = (newSpentAmount / prev.amount) * 100

            // Update the budget percentage
            setBudgetPercentage(newPercentage)

            // Return updated budget
            return {
              ...prev,
              spentAmount: newSpentAmount,
              availableAmount: newAvailableAmount,
            }
          })
        }

        // Refresh expense data after a budget update
        refreshExpenseData()
      },
      [selectedBudget],
    ),
  )

  // Function to refresh expense data
  const refreshExpenseData = useCallback(async () => {
    try {
      // Fetch expenses with a small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
      const expensesResult = await getExpenses()
      if (expensesResult.success) {
        setExpenses(expensesResult.expenses)
      }

      // Fetch summary with a small delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      const summaryResult = await getExpenseSummary()
      if (summaryResult.success) {
        setSummary(summaryResult.summary)
      }
    } catch (error) {
      console.error("Error refreshing expense data:", error)
    }
  }, [])

  // Fetch expenses, budgets, and summary on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch expenses
        const expensesResult = await getExpenses()
        if (expensesResult.success) {
          setExpenses(expensesResult.expenses)
        } else {
          toast({
            title: "Error",
            description: expensesResult.error || "Failed to fetch expenses",
            variant: "destructive",
          })
        }

        // Add a small delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Fetch budgets for the dropdown
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets.map((budget) => ({ id: budget.id, name: budget.name })))

          // If there's a budget ID in the URL, select it
          if (budgetIdParam) {
            // Add another small delay
            await new Promise((resolve) => setTimeout(resolve, 300))

            const budgetResult = await getBudgetById(budgetIdParam)
            if (budgetResult.success) {
              // Ensure numeric values are properly parsed
              const budget = budgetResult.budget
              setSelectedBudget({
                id: budget.id,
                name: budget.name,
                availableAmount: Number(budget.availableAmount),
                amount: Number(budget.amount),
                spentAmount: Number(budget.spentAmount),
              })
              setBudgetId(budgetIdParam)

              // Calculate budget usage percentage
              const percentage = (Number(budget.spentAmount) / Number(budget.amount)) * 100
              setBudgetPercentage(percentage)
            }
          }
        }

        // Add a small delay before fetching summary
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Fetch summary
        const summaryResult = await getExpenseSummary()
        if (summaryResult.success) {
          setSummary({
            total: Number(summaryResult.summary.total),
            approved: Number(summaryResult.summary.approved),
            pending: Number(summaryResult.summary.pending),
            withAllocation: Number(summaryResult.summary.withAllocation),
          })
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
  }, [toast, budgetIdParam])

  // Filter expenses based on search and budget
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.includes(searchTerm) ||
      expense.budgetName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBudget = !budgetIdParam || expense.budgetId === budgetIdParam

    return matchesSearch && matchesBudget
  })

  // Handle budget selection
  const handleBudgetChange = async (value: string) => {
    setBudgetId(value)
    setExceedsBudget(false)
    setNeedsAllocation(false)

    if (!value) {
      setSelectedBudget(null)
      return
    }

    try {
      // Show loading state
      setIsProcessing(true)

      const result = await getBudgetById(value)
      if (result.success) {
        // Ensure numeric values are properly parsed
        const budget = result.budget
        setSelectedBudget({
          id: budget.id,
          name: budget.name,
          availableAmount: Number(budget.availableAmount),
          amount: Number(budget.amount),
          spentAmount: Number(budget.spentAmount),
        })

        // Calculate budget usage percentage
        const percentage = (Number(budget.spentAmount) / Number(budget.amount)) * 100
        setBudgetPercentage(percentage)

        // Check if current amount exceeds budget
        if (amount) {
          const numericAmount = parseRupiah(amount)
          if (numericAmount > Number(budget.availableAmount)) {
            setExceedsBudget(true)
            setNeedsAllocation(true)
          }
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch budget details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching budget details:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value)

    if (selectedBudget && value) {
      const numericAmount = parseRupiah(value)
      if (numericAmount > selectedBudget.availableAmount) {
        setExceedsBudget(true)
        setNeedsAllocation(true)
      } else {
        setExceedsBudget(false)
        setNeedsAllocation(false)
      }
    }
  }

  // Handle expense creation
  const handleCreateExpense = async () => {
    if (!budgetId || !description || !amount || !expenseDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setIsProcessing(true)

    const formData = new FormData()
    formData.append("budgetId", budgetId)
    formData.append("description", description)
    formData.append("amount", amount)
    formData.append("date", expenseDate.toISOString().split("T")[0])
    formData.append("submittedBy", user?.name || "Unknown User")
    formData.append("notes", notes)

    try {
      const result = await createExpense(formData)
      if (result.success) {
        // Show success message
        toast({
          title: "Success",
          description: result.needsAllocation
            ? "Expense created successfully with additional allocation request"
            : "Expense created successfully",
        })

        // Emit budget update event if budgetId and expenseAmount are returned
        if (result.budgetId && result.expenseAmount) {
          emitBudgetUpdate(result.budgetId, result.expenseAmount)
        }

        // Refresh expenses
        const expensesResult = await getExpenses()
        if (expensesResult.success) {
          setExpenses(expensesResult.expenses)
        }

        // Refresh summary
        const summaryResult = await getExpenseSummary()
        if (summaryResult.success) {
          setSummary({
            total: Number(summaryResult.summary.total),
            approved: Number(summaryResult.summary.approved),
            pending: Number(summaryResult.summary.pending),
            withAllocation: Number(summaryResult.summary.withAllocation),
          })
        }

        // Refresh the selected budget to show updated amounts
        if (budgetId) {
          const budgetResult = await getBudgetById(budgetId)
          if (budgetResult.success) {
            const budget = budgetResult.budget
            setSelectedBudget({
              id: budget.id,
              name: budget.name,
              availableAmount: Number(budget.availableAmount),
              amount: Number(budget.amount),
              spentAmount: Number(budget.spentAmount),
            })

            // Update budget usage percentage
            const percentage = (Number(budget.spentAmount) / Number(budget.amount)) * 100
            setBudgetPercentage(percentage)
          }
        }

        // Reset form and close dialog
        setBudgetId(budgetIdParam || "")
        setDescription("")
        setAmount("")
        setNotes("")
        setExpenseDate(new Date())
        setExceedsBudget(false)
        setNeedsAllocation(false)
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating expense:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsProcessing(false)
    }
  }

  // Open expense details
  const openExpenseDetails = async (expense: Expense) => {
    try {
      setIsProcessing(true)
      const result = await getExpenseById(expense.id)
      if (result.success) {
        setSelectedExpense(result.expense)
        setIsDetailsOpen(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch expense details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching expense details:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
            Pengelolaan Pengeluaran
          </h2>
          <p className="text-muted-foreground">Catat dan kelola pengeluaran untuk setiap anggaran</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="rounded-full animated-gradient-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                Catat Pengeluaran Baru
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Catat Pengeluaran Baru</DialogTitle>
              <DialogDescription>Isi detail pengeluaran baru. Klik simpan setelah selesai.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 relative">
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm font-medium">Memproses...</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="budget">Anggaran</Label>
                <Select value={budgetId} onValueChange={handleBudgetChange}>
                  <SelectTrigger id="budget" className="rounded-lg">
                    <SelectValue placeholder="Pilih anggaran" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBudget && (
                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total anggaran:</span>
                      <span className="font-medium">{formatRupiah(selectedBudget.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Terpakai:</span>
                      <div className="text-right">
                        <span className="font-medium">{formatRupiah(selectedBudget.spentAmount)}</span>
                        <BudgetUpdateIndicator
                          budgetId={selectedBudget.id}
                          lastUpdateBudgetId={lastUpdate?.budgetId}
                          expenseAmount={lastUpdate?.expenseAmount || 0}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sisa dana:</span>
                      <span
                        className={`font-medium ${selectedBudget.availableAmount < 0 ? "text-red-500" : "text-green-600"}`}
                      >
                        {formatRupiah(selectedBudget.availableAmount)}
                      </span>
                    </div>

                    {/* Add budget usage progress bar */}
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-xs">
                        <span>Penggunaan Anggaran</span>
                        <span>{budgetPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={budgetPercentage}
                        className={`h-2 rounded-full ${
                          budgetPercentage > 90
                            ? "bg-red-500"
                            : budgetPercentage > 70
                              ? "bg-yellow-500"
                              : "bg-green-600"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Pengeluaran</Label>
                <Input
                  id="description"
                  placeholder="Masukkan deskripsi pengeluaran"
                  className="rounded-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Pengeluaran</Label>
                  <RupiahInput
                    id="amount"
                    placeholder="0"
                    className={`rounded-lg ${exceedsBudget ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={amount}
                    onChange={handleAmountChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Pengeluaran</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {expenseDate ? format(expenseDate, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={expenseDate}
                        onSelect={setExpenseDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan atau detail tambahan"
                  className="rounded-lg"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <AnimatePresence>
                {exceedsBudget && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Melebihi Anggaran</AlertTitle>
                      <AlertDescription>
                        Jumlah pengeluaran melebihi sisa anggaran yang tersedia (
                        {formatRupiah(selectedBudget?.availableAmount || 0)}).
                        {needsAllocation && " Sistem akan otomatis membuat permintaan alokasi tambahan."}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <LoadingButton
                className="rounded-full animated-gradient-button text-white"
                onClick={handleCreateExpense}
                isLoading={isSubmitting}
                loadingText="Menyimpan..."
              >
                Simpan Pengeluaran
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search section */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari pengeluaran..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Pengeluaran</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.total)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Pengeluaran Bulan Ini</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.approved)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">
                  Dengan Alokasi Tambahan
                </CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.withAllocation)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Expense Table */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">ID</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Anggaran</TableHead>
                  <TableHead className="font-display">Tanggal</TableHead>
                  <TableHead className="text-right font-display">Jumlah</TableHead>
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
                      <p className="mt-2 text-muted-foreground">Memuat data pengeluaran...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Tidak ada data pengeluaran yang ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      className="hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.budgetName}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupiah(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => openExpenseDetails(expense)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Expense Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display">{selectedExpense.description}</DialogTitle>
                <DialogDescription>Detail pengeluaran</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ID Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{selectedExpense.id}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Anggaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{selectedExpense.budgetName}</p>
                      <p className="text-xs text-muted-foreground">{selectedExpense.budgetId}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tanggal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{selectedExpense.date}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Jumlah</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{formatRupiah(selectedExpense.amount)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Diajukan Oleh</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">{selectedExpense.submittedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedExpense.submittedAt).toLocaleString("id-ID")}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedExpense.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Catatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedExpense.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedExpense.additionalAllocation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informasi Alokasi Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">ID Alokasi</h4>
                          <p>{selectedExpense.additionalAllocationId}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Jumlah Alokasi Tambahan</h4>
                          <p className="font-medium">{formatRupiah(selectedExpense.additionalAllocation.amount)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Alasan</h4>
                          <p>{selectedExpense.additionalAllocation.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <LoadingOverlay isLoading={isProcessing} />
    </motion.div>
  )
}
