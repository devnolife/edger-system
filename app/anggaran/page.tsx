"use client"

import { Separator } from "@/components/ui/separator"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CalendarIcon, Edit, Eye, Plus, Search, Trash } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { getBudgets, createBudget, getBudgetById, getBudgetSummary, type Budget } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"

export default function Anggaran() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalAdditional: 0,
    totalAvailable: 0,
  })

  // Form state
  const [budgetName, setBudgetName] = useState("")
  const [department, setDepartment] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  // Fetch budgets and summary on component mount
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
  }, [toast])

  // Filter budgets based on tab, search, and status
  const filteredBudgets = budgets.filter((budget) => {
    const matchesTab =
      (activeTab === "active" && budget.status === "active") ||
      (activeTab === "completed" && budget.status === "completed") ||
      (activeTab === "draft" && budget.status === "draft") ||
      activeTab === "all"

    const matchesSearch =
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.id.includes(searchTerm) ||
      budget.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || budget.status === statusFilter

    return matchesTab && matchesSearch && matchesStatus
  })

  const canManageBudgets = role === "superadmin" || role === "admin"

  // Handle budget creation
  const handleCreateBudget = async () => {
    if (!budgetName || !department || !amount || !startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("name", budgetName)
    formData.append("department", department)
    formData.append("amount", amount)
    formData.append("startDate", startDate.toISOString().split("T")[0])
    formData.append("endDate", endDate.toISOString().split("T")[0])
    formData.append("status", "draft")
    formData.append("description", description)
    formData.append("createdBy", user?.name || "Unknown User")

    try {
      const result = await createBudget(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Budget created successfully",
        })

        // Refresh budgets
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets)
        }

        // Reset form and close dialog
        setBudgetName("")
        setDepartment("")
        setAmount("")
        setDescription("")
        setStartDate(undefined)
        setEndDate(undefined)
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create budget",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating budget:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Open budget details
  const openBudgetDetails = async (budget: Budget) => {
    try {
      const result = await getBudgetById(budget.id)
      if (result.success) {
        setSelectedBudget(result.budget)
        setIsDetailsOpen(true)
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
          <p className="text-muted-foreground">Buat dan kelola anggaran untuk berbagai departemen</p>
        </div>
        {canManageBudgets && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="rounded-full animated-gradient-button text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Anggaran Baru
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Buat Anggaran Baru</DialogTitle>
                <DialogDescription>Isi detail anggaran baru. Klik simpan setelah selesai.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-name">Nama Anggaran</Label>
                    <Input
                      id="budget-name"
                      placeholder="Masukkan nama anggaran"
                      className="rounded-lg"
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departemen</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="department" className="rounded-lg">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Operasional">Operasional</SelectItem>
                        <SelectItem value="Pemasaran">Pemasaran</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="SDM">SDM</SelectItem>
                        <SelectItem value="Keuangan">Keuangan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {startDate ? format(startDate, "PPP") : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {endDate ? format(endDate, "PPP") : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Anggaran</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      className="pl-10 rounded-lg"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi anggaran dan tujuannya"
                    className="rounded-lg"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button className="rounded-full animated-gradient-button text-white" onClick={handleCreateBudget}>
                  Simpan Anggaran
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Search and filter section */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] rounded-full border-primary/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={container} className="grid gap-6 md:grid-cols-4">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Anggaran Aktif</CardTitle>
                <div className="text-2xl font-bold">Rp{summary.totalBudget.toLocaleString("id-ID")}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Terpakai</CardTitle>
                <div className="text-2xl font-bold">Rp{summary.totalSpent.toLocaleString("id-ID")}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-3 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Alokasi Tambahan</CardTitle>
                <div className="text-2xl font-bold">Rp{summary.totalAdditional.toLocaleString("id-ID")}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Sisa Anggaran</CardTitle>
                <div className="text-2xl font-bold">Rp{summary.totalAvailable.toLocaleString("id-ID")}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Budget Tabs */}
      <motion.div variants={item}>
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex md:grid-cols-none rounded-full p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="active"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Aktif
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Selesai
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Draft
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Semua
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
                  <TableHead className="font-display">Departemen</TableHead>
                  <TableHead className="font-display">Periode</TableHead>
                  <TableHead className="text-right font-display">Jumlah (Rp)</TableHead>
                  <TableHead className="font-display">Penggunaan</TableHead>
                  <TableHead className="text-right font-display">Sisa (Rp)</TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-muted-foreground">Memuat data anggaran...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
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
                        className="hover:bg-primary/5 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <TableCell className="font-medium">{budget.id}</TableCell>
                        <TableCell>{budget.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 rounded-full"
                          >
                            {budget.department}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {budget.startDate} - {budget.endDate}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {budget.amount.toLocaleString("id-ID")}
                        </TableCell>
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
                          {budget.availableAmount.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="rounded-full"
                            variant={
                              budget.status === "active"
                                ? "default"
                                : budget.status === "completed"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {budget.status === "active" ? "Aktif" : budget.status === "completed" ? "Selesai" : "Draft"}
                          </Badge>
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
                              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {role === "superadmin" && (
                              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
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

      {/* Budget Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl">
          {selectedBudget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display">{selectedBudget.name}</DialogTitle>
                <DialogDescription>Detail anggaran dan penggunaannya</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3 rounded-full p-1 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="overview"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Ringkasan
                  </TabsTrigger>
                  <TabsTrigger
                    value="expenses"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Pengeluaran
                  </TabsTrigger>
                  <TabsTrigger
                    value="allocations"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Alokasi Tambahan
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">ID Anggaran</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{selectedBudget.id}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Departemen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{selectedBudget.department}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Periode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">
                          {selectedBudget.startDate} s/d {selectedBudget.endDate}
                        </p>
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
                            selectedBudget.status === "active"
                              ? "default"
                              : selectedBudget.status === "completed"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {selectedBudget.status === "active"
                            ? "Aktif"
                            : selectedBudget.status === "completed"
                              ? "Selesai"
                              : "Draft"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ringkasan Keuangan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Anggaran Awal:</span>
                          <span className="font-medium">Rp {selectedBudget.amount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Terpakai:</span>
                          <span className="font-medium">Rp {selectedBudget.spentAmount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alokasi Tambahan:</span>
                          <span className="font-medium">
                            Rp {(selectedBudget.additionalAmount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Sisa Anggaran:</span>
                          <span>Rp {selectedBudget.availableAmount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Penggunaan Anggaran</span>
                            <span>{((selectedBudget.spentAmount / selectedBudget.amount) * 100).toFixed(0)}%</span>
                          </div>
                          <Progress
                            value={(selectedBudget.spentAmount / selectedBudget.amount) * 100}
                            className="h-3 rounded-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Expenses Tab */}
                <TabsContent value="expenses" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pengeluaran Terkait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Daftar pengeluaran yang terkait dengan anggaran ini akan ditampilkan di sini.
                      </p>
                      <Button className="rounded-full" asChild>
                        <a href={`/pengeluaran?budget=${selectedBudget.id}`}>Lihat Semua Pengeluaran</a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Allocations Tab */}
                <TabsContent value="allocations" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Alokasi Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Daftar alokasi tambahan untuk anggaran ini akan ditampilkan di sini.
                      </p>
                      <Button className="rounded-full" asChild>
                        <a href={`/anggaran-tambahan?budget=${selectedBudget.id}`}>Lihat Semua Alokasi</a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
