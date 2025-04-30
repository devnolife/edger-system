"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Download,
  FileText,
  Search,
  ArrowUpRight,
  CalendarPlus2Icon as CalendarIcon2,
  CreditCard,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { formatRupiah } from "@/lib/format-rupiah"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getExpensesWithBudget,
  getExpenseSummary,
  getBudgetsWithExpenses,
  getExpensesByBudget,
  type ExpenseTransaction,
  type ExpenseSummary,
} from "../actions/buku-besar-actions"

export default function BukuBesar() {
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState("")
  const [budgetFilter, setBudgetFilter] = useState("all")
  const [date, setDate] = useState<Date>()
  const [selectedExpense, setSelectedExpense] = useState<ExpenseTransaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // State for data
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseTransaction[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    currentMonthExpenses: 0,
    transactionCount: 0,
  })
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch expenses and summary data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch expenses with budget information
        const expensesResult = await getExpensesWithBudget()
        if (!expensesResult.success) {
          throw new Error(expensesResult.error || "Failed to fetch expenses")
        }
        setExpenses(expensesResult.expenses)
        setFilteredExpenses(expensesResult.expenses)

        // Fetch expense summary
        const summaryResult = await getExpenseSummary()
        if (!summaryResult.success) {
          throw new Error(summaryResult.error || "Failed to fetch expense summary")
        }
        setSummary(summaryResult.summary)

        // Fetch budgets with expenses
        const budgetsResult = await getBudgetsWithExpenses()
        if (!budgetsResult.success) {
          throw new Error(budgetsResult.error || "Failed to fetch budgets")
        }
        setBudgets(budgetsResult.budgets)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter expenses when search term, budget filter, or date changes
  useEffect(() => {
    let filtered = [...expenses]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.budgetName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply budget filter
    if (budgetFilter !== "all") {
      filtered = filtered.filter((expense) => expense.budgetId === budgetFilter)
    }

    // Apply date filter
    if (date) {
      const dateString = format(date, "yyyy-MM-dd")
      filtered = filtered.filter((expense) => {
        // Convert the expense date format (DD/MM/YYYY) to YYYY-MM-DD for comparison
        const parts = expense.date.split("/")
        const expenseDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
        return expenseDate === dateString
      })
    }

    setFilteredExpenses(filtered)
  }, [searchTerm, budgetFilter, date, expenses])

  // Handle budget filter change
  const handleBudgetFilterChange = async (value: string) => {
    setBudgetFilter(value)
    setIsLoading(true)

    try {
      if (value === "all") {
        const result = await getExpensesWithBudget()
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch expenses")
        }
        setExpenses(result.expenses)
      } else {
        const result = await getExpensesByBudget(value)
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch expenses by budget")
        }
        setExpenses(result.expenses)
      }
    } catch (err) {
      console.error("Error fetching filtered expenses:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Open expense detail dialog
  const openExpenseDetail = (expense: ExpenseTransaction) => {
    setSelectedExpense(expense)
    setIsDetailOpen(true)
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)
      // In a real implementation, this would trigger a download
      alert("Ekspor data berhasil")
    }, 1500)
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

  // Render loading state
  if (isLoading && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Memuat data pengeluaran...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="my-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Terjadi kesalahan saat memuat data: {error}
            <div className="mt-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Coba Lagi
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Buku Besar Pengeluaran
          </h2>
          <p className="text-muted-foreground">Lihat dan analisis semua transaksi pengeluaran dengan sumber anggaran</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal rounded-full border-primary/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "PPP") : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  setDate(date)
                }}
                initialFocus
                className="rounded-xl"
              />
            </PopoverContent>
          </Popover>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="rounded-full border-primary/20"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4 text-primary" />
              )}
              Ekspor
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Pengeluaran</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.totalExpenses)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Pengeluaran Bulan Ini</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.currentMonthExpenses)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Jumlah Transaksi</CardTitle>
                <div className="text-2xl font-bold">{summary.transactionCount} Transaksi</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari transaksi..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={budgetFilter} onValueChange={handleBudgetFilterChange}>
          <SelectTrigger className="w-full md:w-[240px] rounded-full border-primary/20">
            <SelectValue placeholder="Pilih Anggaran" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Anggaran</SelectItem>
            {budgets.map((budget) => (
              <SelectItem key={budget.id} value={budget.id}>
                {budget.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">Tanggal</TableHead>
                  <TableHead className="font-display">ID</TableHead>
                  <TableHead className="font-display">Referensi</TableHead>
                  <TableHead className="font-display">Nama Anggaran</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Metode Pembayaran</TableHead>
                  <TableHead className="text-right font-display">Jumlah</TableHead>
                  <TableHead className="text-right font-display">Detail</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="bg-white dark:bg-black rounded-b-xl">
            {isLoading && expenses.length > 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada data pengeluaran yang ditemukan</div>
            ) : (
              <Table>
                <TableBody>
                  {filteredExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => openExpenseDetail(expense)}
                    >
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.id}</TableCell>
                      <TableCell>{expense.reference}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {expense.budgetName}
                        </span>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        {formatRupiah(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Expense Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Detail Pengeluaran</DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6">
              {/* Budget Source Section */}
              <div className="bg-primary/5 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sumber Anggaran</h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{selectedExpense.budgetName}</div>
                  <Badge variant="outline" className="border-primary/20 text-primary">
                    {selectedExpense.budgetId}
                  </Badge>
                </div>
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">ID Pengeluaran</h3>
                  <p className="font-medium">{selectedExpense.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Referensi</h3>
                  <p className="font-medium">{selectedExpense.reference}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tanggal</h3>
                  <div className="flex items-center">
                    <CalendarIcon2 className="h-4 w-4 mr-2 text-primary" />
                    <p className="font-medium">{selectedExpense.date}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Jumlah</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-red-500" />
                    <p className="font-medium text-red-500">{formatRupiah(selectedExpense.amount)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Metode Pembayaran</h3>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    <p className="font-medium">{selectedExpense.paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Diajukan Oleh</h3>
                  <p className="font-medium">{selectedExpense.submittedBy}</p>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Deskripsi</h3>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p>{selectedExpense.description}</p>
                </div>
              </div>

              {/* Notes Section */}
              {selectedExpense.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Catatan</h3>
                  <div className="flex items-start">
                    <ClipboardList className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <p className="text-sm">{selectedExpense.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </Button>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Cetak
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
