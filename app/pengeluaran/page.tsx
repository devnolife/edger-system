"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Check, Eye, Plus, Search, X } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { formatRupiah } from "@/lib/format-rupiah"
import {
  getExpenses,
  createExpense,
  getExpenseById,
  updateExpenseStatus,
  getExpenseSummary,
  type Expense,
  type ExpenseStatus,
} from "@/app/actions/expense-actions"
import { getBudgets, getBudgetById } from "@/app/actions/budget-actions"

export default function Pengeluaran() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budget")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expenseDate, setExpenseDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
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

  // Tambahkan state untuk menyimpan informasi anggaran yang dipilih
  const [selectedBudget, setSelectedBudget] = useState<{
    id: string
    name: string
    availableAmount: number
  } | null>(null)

  // Form state
  const [budgetId, setBudgetId] = useState(budgetIdParam || "")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

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

        // Fetch budgets for the dropdown
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets.map((budget) => ({ id: budget.id, name: budget.name })))
        }

        // Fetch summary
        const summaryResult = await getExpenseSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
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

  // Filter expenses based on tab, search, status
  const filteredExpenses = expenses.filter((expense) => {
    const matchesTab =
      (activeTab === "pending" && expense.status === "pending") ||
      (activeTab === "approved" && expense.status === "approved") ||
      (activeTab === "rejected" && expense.status === "rejected") ||
      activeTab === "all"

    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.includes(searchTerm) ||
      expense.budgetName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || expense.status === statusFilter

    const matchesBudget = !budgetIdParam || expense.budgetId === budgetIdParam

    return matchesTab && matchesSearch && matchesStatus && matchesBudget
  })

  // Modifikasi fungsi untuk mengambil data anggaran yang dipilih
  const handleBudgetChange = async (value: string) => {
    setBudgetId(value)

    if (!value) {
      setSelectedBudget(null)
      return
    }

    try {
      const result = await getBudgetById(value)
      if (result.success) {
        setSelectedBudget({
          id: result.budget.id,
          name: result.budget.name,
          availableAmount: result.budget.availableAmount,
        })
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

    // Validasi jumlah pengeluaran tidak melebihi sisa dana
    if (selectedBudget && Number(amount) > selectedBudget.availableAmount) {
      toast({
        title: "Validation Error",
        description: `Jumlah pengeluaran melebihi sisa dana anggaran (${formatRupiah(selectedBudget.availableAmount)})`,
        variant: "destructive",
      })
      return
    }

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
        toast({
          title: "Success",
          description: result.needsAllocation
            ? "Expense created successfully with additional allocation request"
            : "Expense created successfully",
        })

        // Refresh expenses
        const expensesResult = await getExpenses()
        if (expensesResult.success) {
          setExpenses(expensesResult.expenses)
        }

        // Refresh summary
        const summaryResult = await getExpenseSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // Reset form and close dialog
        setBudgetId(budgetIdParam || "")
        setDescription("")
        setAmount("")
        setNotes("")
        setExpenseDate(undefined)
        setSelectedBudget(null)
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
    }
  }

  // Open expense details
  const openExpenseDetails = async (expense: Expense) => {
    try {
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
    }
  }

  // Handle expense approval or rejection
  const handleUpdateStatus = async (id: string, status: ExpenseStatus) => {
    try {
      const result = await updateExpenseStatus(id, status, user?.name || "Unknown User")
      if (result.success) {
        toast({
          title: "Success",
          description: `Expense ${status === "approved" ? "approved" : "rejected"} successfully`,
        })

        // Refresh expenses
        const expensesResult = await getExpenses()
        if (expensesResult.success) {
          setExpenses(expensesResult.expenses)
        }

        // Refresh summary
        const summaryResult = await getExpenseSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // Close details dialog
        setIsDetailsOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${status} expense`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${status} expense:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const canManageExpenses = role === "superadmin" || role === "admin" || role === "finance"

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
            <div className="grid gap-4 py-4">
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
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Sisa dana: </span>
                    <span
                      className={`font-medium ${selectedBudget.availableAmount < 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      {formatRupiah(selectedBudget.availableAmount)}
                    </span>
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
                  <RupiahInput id="amount" placeholder="0" className="rounded-lg" value={amount} onChange={setAmount} />
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
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button className="rounded-full animated-gradient-button text-white" onClick={handleCreateExpense}>
                Simpan Pengeluaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search and filter section */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] rounded-full border-primary/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Tertunda</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-4">
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
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Pengeluaran Disetujui</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.approved)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-3 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Menunggu Persetujuan</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.pending)}</div>
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

      {/* Expense Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex md:grid-cols-none rounded-full p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="all"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Semua
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Tertunda
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Disetujui
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Ditolak
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
                  <TableHead className="font-display">Status</TableHead>
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
                      <TableCell>
                        <Badge
                          className="rounded-full"
                          variant={
                            expense.status === "approved"
                              ? "default"
                              : expense.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {expense.status === "approved"
                            ? "Disetujui"
                            : expense.status === "rejected"
                              ? "Ditolak"
                              : "Tertunda"}
                        </Badge>
                      </TableCell>
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
                          {canManageExpenses && expense.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                onClick={() => handleUpdateStatus(expense.id, "approved")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(expense.id, "rejected")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="details"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Detail
                  </TabsTrigger>
                  <TabsTrigger
                    value="allocation"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Alokasi Tambahan
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
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
                        <CardTitle className="text-sm">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge
                          className="rounded-full"
                          variant={
                            selectedExpense.status === "approved"
                              ? "default"
                              : selectedExpense.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {selectedExpense.status === "approved"
                            ? "Disetujui"
                            : selectedExpense.status === "rejected"
                              ? "Ditolak"
                              : "Tertunda"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informasi Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Diajukan Oleh</h4>
                          <p>{selectedExpense.submittedBy}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Tanggal Pengajuan</h4>
                          <p>{new Date(selectedExpense.submittedAt).toLocaleString("id-ID")}</p>
                        </div>
                        {selectedExpense.approvedBy && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Disetujui/Ditolak Oleh</h4>
                            <p>{selectedExpense.approvedBy}</p>
                          </div>
                        )}
                        {selectedExpense.approvedAt && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Tanggal Persetujuan/Penolakan</h4>
                            <p>{new Date(selectedExpense.approvedAt).toLocaleString("id-ID")}</p>
                          </div>
                        )}
                        {selectedExpense.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Catatan</h4>
                            <p>{selectedExpense.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {canManageExpenses && selectedExpense.status === "pending" && (
                    <div className="flex justify-end gap-4 mt-4">
                      <Button
                        variant="outline"
                        className="rounded-full border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedExpense.id, "rejected")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Tolak Pengeluaran
                      </Button>
                      <Button
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleUpdateStatus(selectedExpense.id, "approved")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Setujui Pengeluaran
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Allocation Tab */}
                <TabsContent value="allocation" className="mt-4">
                  {selectedExpense.additionalAllocation ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detail Alokasi Tambahan</CardTitle>
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
                            <h4 className="text-sm font-medium text-muted-foreground">Status Alokasi</h4>
                            <Badge
                              className="rounded-full mt-1"
                              variant={
                                selectedExpense.additionalAllocation.status === "approved"
                                  ? "default"
                                  : selectedExpense.additionalAllocation.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {selectedExpense.additionalAllocation.status === "approved"
                                ? "Disetujui"
                                : selectedExpense.additionalAllocation.status === "rejected"
                                  ? "Ditolak"
                                  : "Tertunda"}
                            </Badge>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Alasan</h4>
                            <p>{selectedExpense.additionalAllocation.reason}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-muted-foreground mb-4">Pengeluaran ini tidak memiliki alokasi tambahan</p>
                      {canManageExpenses && (
                        <Button className="rounded-full" asChild>
                          <a href={`/anggaran-tambahan/new?expense=${selectedExpense.id}`}>Buat Alokasi Tambahan</a>
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
