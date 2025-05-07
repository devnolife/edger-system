"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  Eye,
  AlertTriangle,
  Plus,
  Search,
  ImageIcon,
  CalendarPlus2Icon as CalendarIcon2,
  Filter,
  X,
  Download,
  FileText,
  User,
  Wallet,
  Receipt,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { formatRupiah, parseRupiah } from "@/lib/format-rupiah"
import { formatDate, formatDateRange } from "@/lib/format-date"
import {
  getExpenses,
  createExpense,
  getExpenseById,
  getExpenseSummary,
  type Expense as BaseExpense,
} from "@/app/actions/expense-actions"
import { getBudgets, getBudgetById } from "@/app/actions/budget-actions"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { emitBudgetUpdate, useBudgetUpdates } from "@/hooks/use-budget-updates"
import { BudgetUpdateIndicator } from "@/components/budget-update-indicator"
import { ImageUpload } from "@/components/image-upload"
import Image from "next/image"

// Type for sorting options
type SortField = "date" | "amount" | "description" | "budgetName"
type SortDirection = "asc" | "desc"

// Extend the Expense type to include additionalAllocation
interface Expense extends BaseExpense {
  additionalAllocation?: {
    id: string;
    amount: number;
    status: string;
    reason: string;
  } | null;
}

export default function Pengeluaran() {
  const { user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budget")
  const expenseIdParam = searchParams.get("expense")

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBudgetId, setFilterBudgetId] = useState(budgetIdParam || "")
  const [filterDateRange, setFilterDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [showFilters, setShowFilters] = useState(false)

  // State for sorting
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // State for expense form
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Loading states
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
  const [imageUrl, setImageUrl] = useState("")
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

  // Function to refresh expense data
  const refreshExpenseData = useCallback(async () => {
    try {
      // Fetch expenses with a small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
      const expensesResult = await getExpenses()
      if (expensesResult.success && expensesResult.expenses) {
        setExpenses(expensesResult.expenses as Expense[])
      }

      // Fetch summary with a small delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      const summaryResult = await getExpenseSummary()
      if (summaryResult.success && summaryResult.summary) {
        setSummary({
          total: Number(summaryResult.summary.total) || 0,
          approved: Number(summaryResult.summary.approved) || 0,
          pending: Number(summaryResult.summary.pending) || 0,
          withAllocation: Number(summaryResult.summary.withAllocation) || 0,
        })
      }
    } catch (error) {
      console.error("Error refreshing expense data:", error)
    }
  }, [])

  // Use the budget updates hook to listen for updates
  const { lastUpdate } = useBudgetUpdates(
    useCallback(
      (event: { budgetId: string; expenseAmount: number }) => {
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
      [selectedBudget, refreshExpenseData],
    ),
  )

  // Fetch expenses, budgets, and summary on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch expenses
        const expensesResult = await getExpenses()
        if (expensesResult.success && expensesResult.expenses) {
          setExpenses(expensesResult.expenses as Expense[])
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
            if (budgetResult.success && budgetResult.budget) {
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
              setFilterBudgetId(budgetIdParam)

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
        if (summaryResult.success && summaryResult.summary) {
          setSummary({
            total: Number(summaryResult.summary.total) || 0,
            approved: Number(summaryResult.summary.approved) || 0,
            pending: Number(summaryResult.summary.pending) || 0,
            withAllocation: Number(summaryResult.summary.withAllocation) || 0,
          })
        }

        // If there's an expense ID in the URL, open its details
        if (expenseIdParam) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          const result = await getExpenseById(expenseIdParam)
          if (result.success && result.expense) {
            setSelectedExpense(result.expense as Expense)
            setIsDetailsOpen(true)
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
  }, [toast, budgetIdParam, expenseIdParam])

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    // First filter the expenses
    const result = expenses.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.id.includes(searchTerm) ||
        expense.budgetName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBudget = !filterBudgetId || expense.budgetId === filterBudgetId

      // Date range filtering
      const expenseDate = new Date(expense.date)
      const matchesDateFrom = !filterDateRange.from || expenseDate >= filterDateRange.from
      const matchesDateTo = !filterDateRange.to || expenseDate <= filterDateRange.to

      return matchesSearch && matchesBudget && matchesDateFrom && matchesDateTo
    })

    // Then sort the filtered expenses
    return result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "amount":
          comparison = a.amount - b.amount
          break
        case "description":
          comparison = a.description.localeCompare(b.description)
          break
        case "budgetName":
          comparison = (a.budgetName || "").localeCompare(b.budgetName || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [expenses, searchTerm, filterBudgetId, filterDateRange, sortField, sortDirection])

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
      if (result.success && result.budget) {
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
    // Validate required fields
    if (!budgetId) {
      toast({
        title: "Validasi Gagal",
        description: "Silakan pilih anggaran terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    if (!description) {
      toast({
        title: "Validasi Gagal",
        description: "Deskripsi pengeluaran wajib diisi",
        variant: "destructive",
      })
      return
    }

    if (!amount) {
      toast({
        title: "Validasi Gagal",
        description: "Jumlah pengeluaran wajib diisi",
        variant: "destructive",
      })
      return
    }

    if (!expenseDate) {
      toast({
        title: "Validasi Gagal",
        description: "Tanggal pengeluaran wajib diisi",
        variant: "destructive",
      })
      return
    }

    if (!imageUrl) {
      toast({
        title: "Validasi Gagal",
        description: "Bukti pengeluaran (foto) wajib diupload",
        variant: "destructive",
      })
      return
    }

    // Set loading states
    setIsSubmitting(true)
    setIsProcessing(true)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("budgetId", budgetId)
      formData.append("description", description)
      formData.append("amount", amount)
      formData.append("date", expenseDate.toISOString().split("T")[0])
      formData.append("submittedBy", user?.name || "Unknown User")
      formData.append("notes", notes)
      formData.append("imageUrl", imageUrl) // Add the image URL

      // Call the server action
      const result = await createExpense(formData)

      if (result.success) {
        // Show success message
        toast({
          title: "Berhasil",
          description: result.needsAllocation
            ? "Pengeluaran berhasil dicatat dengan permintaan alokasi tambahan"
            : "Pengeluaran berhasil dicatat",
        })

        // Emit budget update event if budgetId and expenseAmount are returned
        if (result.budgetId && result.expenseAmount) {
          emitBudgetUpdate(result.budgetId, result.expenseAmount)
        }

        // Refresh expenses
        await refreshExpenseData()

        // Reset form and close dialog
        setBudgetId(budgetIdParam || "")
        setDescription("")
        setAmount("")
        setNotes("")
        setExpenseDate(new Date())
        setExceedsBudget(false)
        setNeedsAllocation(false)
        setImageUrl("") // Reset the image URL
        setIsDialogOpen(false)
      } else {
        // Show specific error message
        toast({
          title: "Gagal",
          description: result.error || "Gagal mencatat pengeluaran. Silakan coba lagi.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating expense:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan tak terduga. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      // Reset loading states
      setIsSubmitting(false)
      setIsProcessing(false)
    }
  }

  // Open expense details
  const openExpenseDetails = async (expense: Expense) => {
    try {
      setIsProcessing(true)
      const result = await getExpenseById(expense.id)
      if (result.success && result.expense) {
        setSelectedExpense(result.expense as Expense)
        setIsDetailsOpen(true)
        setActiveTab("details")
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

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setFilterBudgetId("")
    setFilterDateRange({ from: undefined, to: undefined })
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Catat Pengeluaran Baru</DialogTitle>
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
                          lastUpdateBudgetId={lastUpdate?.budgetId || null}
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
                        className={`h-2 rounded-full ${budgetPercentage > 90
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
                  className="rounde
                          d-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="spe-y-2">
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
                        {expenseDate ? formatDate(expenseDate) : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={expenseDate}
                        onSelect={(date) => date && setExpenseDate(date)}
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
                  className="rounded-lg mb-0"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <ImageUpload onImageUploaded={(url) => setImageUrl(url)} className="mt-4" />
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
                disabled={isSubmitting || !budgetId || !description || !amount}
              >
                Simpan Pengeluaran
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-4">
        <motion.div variants={item} className="md:col-span-4">
          <Card className="overflow-hidden rounded-2xl border-none shadow-md">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                <div className="p-6 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                    <h3 className="text-2xl font-bold mt-1">{formatRupiah(summary.total)}</h3>
                  </div>
                </div>

                <div className="p-6 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CalendarIcon2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</p>
                    <h3 className="text-2xl font-bold mt-1">{formatRupiah(summary.approved)}</h3>
                  </div>
                </div>

                <div className="p-6 flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dengan Alokasi Tambahan</p>
                    <h3 className="text-2xl font-bold mt-1">{formatRupiah(summary.withAllocation)}</h3>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Search and filters section */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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

          <Button
            variant="outline"
            className="rounded-full flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
            {(filterBudgetId || filterDateRange.from || filterDateRange.to) && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {(filterBudgetId ? 1 : 0) + (filterDateRange.from || filterDateRange.to ? 1 : 0)}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              // Placeholder for export functionality
              toast({
                title: "Export",
                description: "Fitur export akan segera tersedia",
              })
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="rounded-xl border border-primary/10">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Anggaran</Label>
                      <Select value={filterBudgetId} onValueChange={setFilterBudgetId}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Semua anggaran" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua anggaran</SelectItem>
                          {budgets.map((budget) => (
                            <SelectItem key={budget.id} value={budget.id}>
                              {budget.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rentang Tanggal</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDateRange(filterDateRange.from, filterDateRange.to)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={filterDateRange.from}
                            selected={{
                              from: filterDateRange.from,
                              to: filterDateRange.to,
                            }}
                            onSelect={(range) =>
                              setFilterDateRange({
                                from: range?.from,
                                to: range?.to,
                              })
                            }
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-end space-x-2">
                      <Button variant="outline" className="rounded-full flex-1" onClick={resetFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Reset Filter
                      </Button>

                      <Button
                        className="rounded-full flex-1 bg-primary text-white hover:bg-primary/90"
                        onClick={() => setShowFilters(false)}
                      >
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Expense Table */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Daftar Pengeluaran</h3>
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredAndSortedExpenses.length} dari {expenses.length} pengeluaran
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-display w-[100px]">ID</TableHead>
                    <TableHead className="font-display">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 p-0 h-auto font-display hover:bg-transparent"
                        onClick={() => handleSort("description")}
                      >
                        Deskripsi
                        {sortField === "description" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </Button>
                    </TableHead>
                    <TableHead className="font-display">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 p-0 h-auto font-display hover:bg-transparent"
                        onClick={() => handleSort("budgetName")}
                      >
                        Anggaran
                        {sortField === "budgetName" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </Button>
                    </TableHead>
                    <TableHead className="font-display">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 p-0 h-auto font-display hover:bg-transparent"
                        onClick={() => handleSort("date")}
                      >
                        Tanggal
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </Button>
                    </TableHead>
                    <TableHead className="font-display w-[80px]">Bukti</TableHead>
                    <TableHead className="font-display text-right">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 p-0 h-auto font-display hover:bg-transparent ml-auto"
                        onClick={() => handleSort("amount")}
                      >
                        Jumlah
                        {sortField === "amount" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </Button>
                    </TableHead>
                    <TableHead className="font-display text-right w-[80px]">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          </div>
          <div className="bg-white dark:bg-black rounded-b-xl">
            <div className="overflow-x-auto">
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
                  ) : filteredAndSortedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">Tidak ada data pengeluaran yang ditemukan</p>
                          {(filterBudgetId || filterDateRange.from || filterDateRange.to || searchTerm) && (
                            <Button variant="outline" className="mt-4 rounded-full" onClick={resetFilters}>
                              <X className="h-4 w-4 mr-2" />
                              Reset Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedExpenses.map((expense, index) => (
                      <motion.tr
                        key={expense.id}
                        className="hover:bg-primary/5 transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openExpenseDetails(expense)}
                      >
                        <TableCell className="font-medium text-xs text-muted-foreground w-[100px]">
                          {expense.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{expense.description}</div>
                          {expense.additionalAllocationId && (
                            <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Alokasi Tambahan
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{expense.budgetName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {expense.date}
                          </div>
                        </TableCell>
                        <TableCell className="w-[80px]">
                          {expense.imageUrl ? (
                            <div className="relative h-10 w-10 cursor-pointer rounded-md overflow-hidden border">
                              <Image
                                src={expense.imageUrl || "/placeholder.svg"}
                                alt="Receipt"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-md">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(expense.amount)}</TableCell>
                        <TableCell className="text-right w-[80px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              openExpenseDetails(expense)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Expense Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[680px] rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {selectedExpense && (
            <>
              <div className="bg-gradient-to-r from-primary to-secondary p-3 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold">{selectedExpense.description}</h2>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <span>{formatRupiah(selectedExpense.amount)}</span>
                      <span>•</span>
                      <span>{selectedExpense.date}</span>
                    </div>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-xs">
                    {selectedExpense.additionalAllocationId ? "Dengan Alokasi Tambahan" : "Pengeluaran Reguler"}
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="p-3 flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                  <TabsTrigger value="details" className="rounded-full text-xs py-1">
                    Detail Pengeluaran
                  </TabsTrigger>
                  <TabsTrigger value="receipt" className="rounded-full text-xs py-1">
                    Bukti Pengeluaran
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-1 overflow-y-auto pr-1" style={{ maxHeight: '350px' }}>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">ID Pengeluaran</span>
                      </div>
                      <p className="font-medium">{selectedExpense.id}</p>
                    </div>

                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Anggaran</span>
                      </div>
                      <p className="font-medium">{selectedExpense.budgetName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedExpense.budgetId}</p>
                    </div>

                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Diajukan Oleh</span>
                      </div>
                      <p className="font-medium">{selectedExpense.submittedBy}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(selectedExpense.submittedAt).toLocaleString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedExpense.notes && (
                    <div className="bg-muted/30 p-2 rounded-lg mt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Catatan</span>
                      </div>
                      <p className="text-muted-foreground">{selectedExpense.notes}</p>
                    </div>
                  )}

                  {selectedExpense && selectedExpense.additionalAllocationId && (
                    <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900 p-2 rounded-lg mt-1">
                      <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-3 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Informasi Alokasi Tambahan
                      </h3>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <h4 className="text-sm text-blue-700 dark:text-blue-400">ID Alokasi</h4>
                          <p className="font-medium">{selectedExpense.additionalAllocationId}</p>
                        </div>
                        {selectedExpense.additionalAllocation && (
                          <>
                            <div>
                              <h4 className="text-sm text-blue-700 dark:text-blue-400">Jumlah Alokasi Tambahan</h4>
                              <p className="font-medium">{formatRupiah(selectedExpense.additionalAllocation.amount)}</p>
                            </div>
                            <div className="md:col-span-3">
                              <h4 className="text-sm text-blue-700 dark:text-blue-400">Alasan</h4>
                              <p>{selectedExpense.additionalAllocation.reason}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="receipt" className="mt-2 overflow-y-auto" style={{ maxHeight: '350px' }}>
                  {selectedExpense?.imageUrl ? (
                    <div className="space-y-2">
                      <div className="relative aspect-auto h-[160px] w-full bg-muted/30 rounded-lg overflow-hidden">
                        <Image
                          src={selectedExpense.imageUrl || "/placeholder.svg"}
                          alt="Receipt"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">Tidak ada bukti pengeluaran</h3>
                      <p className="text-muted-foreground">Pengeluaran ini tidak memiliki bukti yang terlampir</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="p-1 border-t flex justify-end">
                <Button variant="outline" className="rounded-full text-xs py-0.5 h-6" onClick={() => setIsDetailsOpen(false)}>
                  Tutup
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <LoadingOverlay isLoading={isProcessing} />
    </motion.div>
  )
}
