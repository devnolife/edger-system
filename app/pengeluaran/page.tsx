"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CalendarIcon, Check, FileText, Plus, Search, X } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { BudgetService, type Expense, type Budget, type AdditionalAllocation } from "@/lib/budget-service"

export default function Pengeluaran() {
  const { role, user } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [budgetFilter, setBudgetFilter] = useState("all")
  const [date, setDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  // Form state
  const [expenseDesc, setExpenseDesc] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [selectedBudget, setSelectedBudget] = useState("")
  const [selectedDept, setSelectedDept] = useState("")
  const [notes, setNotes] = useState("")

  // Allocation form state
  const [needsAllocation, setNeedsAllocation] = useState(false)
  const [shortageAmount, setShortageAmount] = useState(0)
  const [allocationReason, setAllocationReason] = useState("")
  const [allocationBudget, setAllocationBudget] = useState<Budget | null>(null)

  const expenses: Expense[] = [
    {
      id: "EXP-2023-0001",
      budgetId: "BDG-2023-001",
      description: "Pembelian Peralatan Kantor",
      date: "2023-07-15",
      amount: 2500000,
      department: "Operasional",
      status: "approved",
      submittedBy: "Sarah Williams",
      submittedAt: "2023-07-15T09:30:00Z",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-07-15T13:45:00Z",
    },
    {
      id: "EXP-2023-0002",
      budgetId: "BDG-2023-002",
      description: "Biaya Iklan Digital",
      date: "2023-07-18",
      amount: 15000000,
      department: "Pemasaran",
      status: "approved",
      submittedBy: "John Doe",
      submittedAt: "2023-07-18T10:20:00Z",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-07-18T16:30:00Z",
    },
    {
      id: "EXP-2023-0003",
      budgetId: "BDG-2023-003",
      description: "Pembaruan Lisensi Software",
      date: "2023-07-20",
      amount: 8500000,
      department: "IT",
      status: "approved",
      submittedBy: "Mike Johnson",
      submittedAt: "2023-07-20T08:15:00Z",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-07-20T11:40:00Z",
    },
    {
      id: "EXP-2023-0004",
      budgetId: "BDG-2023-004",
      description: "Pelatihan Karyawan",
      date: "2023-07-25",
      amount: 5000000,
      department: "SDM",
      status: "pending",
      submittedBy: "Jane Smith",
      submittedAt: "2023-07-25T14:10:00Z",
    },
    {
      id: "EXP-2023-0005",
      budgetId: "BDG-2023-003",
      description: "Pembelian Server Baru",
      date: "2023-07-28",
      amount: 25000000,
      department: "IT",
      status: "pending",
      submittedBy: "Robert Brown",
      submittedAt: "2023-07-28T09:05:00Z",
      additionalAllocationId: "ADD-2023-003",
    },
  ]

  const budgets: Budget[] = [
    {
      id: "BDG-2023-001",
      name: "Anggaran Operasional Q3 2023",
      department: "Operasional",
      amount: 75000000,
      startDate: "2023-07-01",
      endDate: "2023-09-30",
      status: "active",
      createdBy: "Admin Pengguna",
      createdAt: "2023-06-15T10:30:00Z",
      availableAmount: 45000000,
      spentAmount: 30000000,
    },
    {
      id: "BDG-2023-002",
      name: "Anggaran Pemasaran Q3 2023",
      department: "Pemasaran",
      amount: 50000000,
      startDate: "2023-07-01",
      endDate: "2023-09-30",
      status: "active",
      createdBy: "Admin Pengguna",
      createdAt: "2023-06-16T14:20:00Z",
      availableAmount: 20000000,
      spentAmount: 30000000,
    },
    {
      id: "BDG-2023-003",
      name: "Anggaran Pengembangan IT Q3 2023",
      department: "IT",
      amount: 100000000,
      startDate: "2023-07-01",
      endDate: "2023-09-30",
      status: "active",
      createdBy: "Admin Pengguna",
      createdAt: "2023-06-18T09:45:00Z",
      availableAmount: 60000000,
      spentAmount: 40000000,
    },
    {
      id: "BDG-2023-004",
      name: "Anggaran SDM Q3 2023",
      department: "SDM",
      amount: 30000000,
      startDate: "2023-07-01",
      endDate: "2023-09-30",
      status: "active",
      createdBy: "Admin Pengguna",
      createdAt: "2023-06-20T11:15:00Z",
      availableAmount: 15000000,
      spentAmount: 15000000,
    },
  ]

  const allocations: AdditionalAllocation[] = [
    {
      id: "ADD-2023-001",
      originalBudgetId: "BDG-2023-002",
      description: "Tambahan untuk kampanye Q3",
      reason: "Tambahan biaya iklan untuk mencapai target Q3",
      amount: 10000000,
      requestDate: "2023-08-05",
      status: "approved",
      requestedBy: "John Doe",
      requestedAt: "2023-08-05T09:30:00Z",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-08-05T14:20:00Z",
      availableAmount: 4000000,
      spentAmount: 6000000,
    },
    {
      id: "ADD-2023-002",
      originalBudgetId: "BDG-2023-003",
      description: "Tambahan lisensi software baru",
      reason: "Penyesuaian harga lisensi tahunan",
      amount: 8000000,
      requestDate: "2023-07-25",
      status: "approved",
      requestedBy: "Mike Johnson",
      requestedAt: "2023-07-25T10:15:00Z",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-07-25T15:45:00Z",
      availableAmount: 2000000,
      spentAmount: 6000000,
    },
    {
      id: "ADD-2023-003",
      originalBudgetId: "BDG-2023-003",
      description: "Alokasi tambahan untuk server baru",
      reason: "Biaya server melebihi anggaran yang dialokasikan",
      amount: 5000000,
      requestDate: "2023-07-28",
      status: "pending",
      requestedBy: "Robert Brown",
      requestedAt: "2023-07-28T09:15:00Z",
      relatedExpenseId: "EXP-2023-0005",
      availableAmount: 5000000,
      spentAmount: 0,
    },
  ]

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) || expense.id.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter
    const matchesBudget = budgetFilter === "all" || expense.budgetId === budgetFilter

    return matchesSearch && matchesStatus && matchesBudget
  })

  const canApprove = role === "superadmin" || role === "admin"

  // Get budget details by ID
  const getBudgetById = (id: string): Budget | undefined => {
    return budgets.find((budget) => budget.id === id)
  }

  // Get budget name by ID
  const getBudgetName = (id: string): string => {
    const budget = getBudgetById(id)
    return budget ? budget.name : id
  }

  // Handle expense submission
  const handleSubmitExpense = async () => {
    if (!expenseDesc || !expenseAmount || !selectedBudget || !selectedDept || !date) {
      // In a real app, show validation errors
      return
    }

    const amount = Number.parseFloat(expenseAmount)
    const selectedBudgetDetails = getBudgetById(selectedBudget)

    if (!selectedBudgetDetails) {
      return
    }

    // Check if the expense exceeds available budget
    if (amount > selectedBudgetDetails.availableAmount) {
      setNeedsAllocation(true)
      setShortageAmount(amount - selectedBudgetDetails.availableAmount)
      setAllocationBudget(selectedBudgetDetails)
      setIsAllocationDialogOpen(true)
      // Don't close the main dialog yet
      return
    }

    // Create the expense
    const newExpense: Expense = {
      id: BudgetService.generateId("EXP"),
      budgetId: selectedBudget,
      description: expenseDesc,
      amount: amount,
      date: date.toISOString().split("T")[0],
      department: selectedDept,
      status: "pending",
      submittedBy: user?.name || "Unknown User",
      submittedAt: new Date().toISOString(),
      notes: notes,
    }

    // In a real app, save to database
    console.log("New expense created:", newExpense)

    // Reset form and close dialog
    resetForm()
    setIsDialogOpen(false)
  }

  // Handle additional allocation
  const handleSubmitAllocation = () => {
    if (!allocationReason || !allocationBudget) {
      return
    }

    // Create the additional allocation
    const newAllocation: AdditionalAllocation = {
      id: BudgetService.generateId("ADD"),
      originalBudgetId: allocationBudget.id,
      description: `Alokasi tambahan untuk: ${expenseDesc}`,
      reason: allocationReason,
      amount: shortageAmount,
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending",
      requestedBy: user?.name || "Unknown User",
      requestedAt: new Date().toISOString(),
      availableAmount: shortageAmount,
      spentAmount: 0,
    }

    // Create the expense with a reference to the allocation
    const newExpense: Expense = {
      id: BudgetService.generateId("EXP"),
      budgetId: selectedBudget,
      description: expenseDesc,
      amount: Number.parseFloat(expenseAmount),
      date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      department: selectedDept,
      status: "pending",
      submittedBy: user?.name || "Unknown User",
      submittedAt: new Date().toISOString(),
      notes: notes,
      additionalAllocationId: newAllocation.id,
    }

    // In a real app, save both to database
    console.log("New allocation created:", newAllocation)
    console.log("New expense created with allocation:", newExpense)

    // Reset form and close dialogs
    resetForm()
    setIsAllocationDialogOpen(false)
    setIsDialogOpen(false)
  }

  // Reset all form fields
  const resetForm = () => {
    setExpenseDesc("")
    setExpenseAmount("")
    setSelectedBudget("")
    setSelectedDept("")
    setNotes("")
    setDate(undefined)
    setNeedsAllocation(false)
    setShortageAmount(0)
    setAllocationReason("")
    setAllocationBudget(null)
  }

  // Open expense details
  const openExpenseDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsDetailsOpen(true)
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
            Pengeluaran
          </h2>
          <p className="text-muted-foreground">Catat dan kelola pengeluaran terhadap anggaran</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="rounded-full animated-gradient-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Tambah Pengeluaran Baru</DialogTitle>
              <DialogDescription>Isi detail pengeluaran baru. Klik simpan setelah selesai.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-desc">Deskripsi Pengeluaran</Label>
                <Input
                  id="expense-desc"
                  placeholder="Masukkan deskripsi pengeluaran"
                  className="rounded-lg"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {date ? format(date, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-xl" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      className="pl-10 rounded-lg"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Anggaran</Label>
                  <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                    <SelectTrigger id="budget" className="rounded-lg">
                      <SelectValue placeholder="Pilih anggaran" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.name} - Rp{budget.availableAmount.toLocaleString("id-ID")} tersedia
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departemen</Label>
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger id="department" className="rounded-lg">
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="operasional">Operasional</SelectItem>
                      <SelectItem value="pemasaran">Pemasaran</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="sdm">SDM</SelectItem>
                      <SelectItem value="keuangan">Keuangan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan tentang pengeluaran ini"
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
              <Button className="rounded-full animated-gradient-button text-white" onClick={handleSubmitExpense}>
                Simpan Pengeluaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Dialog for Additional Allocation */}
      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Alokasi Anggaran Tambahan</DialogTitle>
            <DialogDescription>
              Pengeluaran melebihi anggaran yang tersedia. Silakan berikan alasan untuk alokasi tambahan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Anggaran tidak mencukupi</AlertTitle>
              <AlertDescription>
                Pengeluaran Rp{Number.parseFloat(expenseAmount).toLocaleString("id-ID")} melebihi anggaran tersedia Rp
                {allocationBudget?.availableAmount.toLocaleString("id-ID") || 0}.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="shortage">Kekurangan</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
                <Input
                  id="shortage"
                  value={shortageAmount.toLocaleString("id-ID")}
                  disabled
                  className="pl-10 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocation-reason">Alasan Permintaan Anggaran Tambahan</Label>
              <Textarea
                id="allocation-reason"
                placeholder="Jelaskan mengapa pengeluaran ini memerlukan alokasi anggaran tambahan"
                className="rounded-lg"
                value={allocationReason}
                onChange={(e) => setAllocationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setIsAllocationDialogOpen(false)
                // Don't close the main expense dialog
              }}
            >
              Batal
            </Button>
            <Button className="rounded-full animated-gradient-button text-white" onClick={handleSubmitAllocation}>
              Ajukan Alokasi Tambahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <Select value={budgetFilter} onValueChange={setBudgetFilter}>
          <SelectTrigger className="w-full md:w-[240px] rounded-full border-primary/20">
            <SelectValue placeholder="Anggaran" />
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

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-4">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Pengeluaran</CardTitle>
                <div className="text-2xl font-bold">Rp56.000.000</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Pengeluaran Disetujui</CardTitle>
                <div className="text-2xl font-bold">Rp26.000.000</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-3 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">
                  Dengan Alokasi Tambahan
                </CardTitle>
                <div className="text-2xl font-bold">Rp5.000.000</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Pengeluaran Tertunda</CardTitle>
                <div className="text-2xl font-bold">Rp30.000.000</div>
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
                  <TableHead className="font-display">Tanggal</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Anggaran</TableHead>
                  <TableHead className="font-display">Departemen</TableHead>
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
                {filteredExpenses.map((expense, index) => {
                  // Check if this expense has an additional allocation
                  const hasAllocation = !!expense.additionalAllocationId

                  return (
                    <motion.tr
                      key={expense.id}
                      className="hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expense.description}
                          {hasAllocation && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300 rounded-full text-xs"
                            >
                              Alokasi Tambahan
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full">
                          {getBudgetName(expense.budgetId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.department}</TableCell>
                      <TableCell className="text-right font-medium">
                        Rp{expense.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full"
                          variant={
                            expense.status === "approved"
                              ? "outline"
                              : expense.status === "pending"
                                ? "secondary"
                                : expense.status === "rejected"
                                  ? "destructive"
                                  : "default"
                          }
                        >
                          {expense.status === "approved"
                            ? "Disetujui"
                            : expense.status === "pending"
                              ? "Tertunda"
                              : "Ditolak"}
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
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canApprove && expense.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-red-500 rounded-full h-8 w-8">
                                <X className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-green-600 rounded-full h-8 w-8">
                                <Check className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Expense Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          {selectedExpense && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Detail Pengeluaran</DialogTitle>
                <DialogDescription>
                  {selectedExpense.id} - {selectedExpense.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Tanggal</h4>
                    <p className="text-base">{selectedExpense.date}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <Badge
                      className="mt-1 rounded-full"
                      variant={
                        selectedExpense.status === "approved"
                          ? "outline"
                          : selectedExpense.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {selectedExpense.status === "approved"
                        ? "Disetujui"
                        : selectedExpense.status === "pending"
                          ? "Tertunda"
                          : "Ditolak"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Jumlah</h4>
                  <p className="text-lg font-semibold">Rp{selectedExpense.amount.toLocaleString("id-ID")}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Anggaran</h4>
                  <p className="text-base">{getBudgetName(selectedExpense.budgetId)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Departemen</h4>
                  <p className="text-base">{selectedExpense.department}</p>
                </div>

                {selectedExpense.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Catatan</h4>
                    <p className="text-base">{selectedExpense.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Diajukan Oleh</h4>
                    <p className="text-base">{selectedExpense.submittedBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedExpense.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedExpense.approvedBy && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Disetujui Oleh</h4>
                      <p className="text-base">{selectedExpense.approvedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedExpense.approvedAt && new Date(selectedExpense.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Show allocation info if this expense has an additional allocation */}
                {selectedExpense.additionalAllocationId && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-600">Alokasi Anggaran Tambahan</h4>
                      {allocations
                        .filter((a) => a.id === selectedExpense.additionalAllocationId)
                        .map((allocation) => (
                          <div key={allocation.id} className="mt-2 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">ID:</span>
                              <span>{allocation.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              <Badge
                                className="rounded-full"
                                variant={allocation.status === "approved" ? "outline" : "secondary"}
                              >
                                {allocation.status === "approved" ? "Disetujui" : "Tertunda"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Jumlah:</span>
                              <span className="font-medium">Rp{allocation.amount.toLocaleString("id-ID")}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Alasan:</span>
                              <p className="mt-1">{allocation.reason}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-full" onClick={() => setIsDetailsOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
