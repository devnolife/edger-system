"use client"

import { TabsContent } from "@/components/ui/tabs"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { Separator } from "@/components/ui/separator"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format-rupiah"
import { CalendarIcon, Edit, Eye, Plus, Search, Trash } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { getBudgets, createBudget, getBudgetById, getBudgetSummary, type Budget } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { useSearchParams } from "next/navigation"
// First, import the budget update hook near the other imports
import { useBudgetUpdates } from "@/hooks/use-budget-updates"
// Import the BudgetUpdateIndicator component at the top of the file
import { BudgetUpdateIndicator } from "@/components/budget-update-indicator"

export default function Anggaran() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budgetId")
  const [searchTerm, setSearchTerm] = useState("")
  const [creationDate, setCreationDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  // First, let's add a refresh state variable near the other state variables
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Form state
  const [budgetName, setBudgetName] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Then, add the hook usage after the other state variables
  // Add this after the other state variables
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

  // Add a function to refresh budget data after the other state variables
  const refreshBudgetData = async () => {
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
  }

  // Modify the useEffect to include refreshTrigger in the dependency array
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
  }, [toast, budgetIdParam, refreshTrigger]) // Add refreshTrigger to the dependency array

  // Filter budgets based on search
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase()) || budget.id.includes(searchTerm)
    return matchesSearch
  })

  // Add a visual indicator for budget updates
  // Add this after the filteredBudgets definition
  const isBudgetRecentlyUpdated = (budgetId: string) => {
    return lastUpdate && lastUpdate.budgetId === budgetId
  }

  const canManageBudgets = role === "superadmin" || role === "admin"

  // Handle budget creation
  const handleCreateBudget = async () => {
    if (!budgetName || !amount || !creationDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", budgetName)
    formData.append("amount", amount)
    formData.append("creationDate", creationDate.toISOString().split("T")[0])
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
        setAmount("")
        setDescription("")
        setCreationDate(new Date())
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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open budget details
  const openBudgetDetails = async (budget: Budget) => {
    setIsLoadingDetails(true)
    setSelectedBudget(budget) // Set initial data from the list
    setIsDetailsOpen(true)

    try {
      // Add a small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))

      const result = await getBudgetById(budget.id)
      if (result.success) {
        setSelectedBudget(result.budget)
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
          <p className="text-muted-foreground">Buat dan kelola anggaran untuk berbagai kebutuhan</p>
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
                  <Label>Tanggal Pembuatan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {creationDate ? format(creationDate, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={creationDate}
                        onSelect={setCreationDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Anggaran</Label>
                  <RupiahInput id="amount" placeholder="0" className="rounded-lg" value={amount} onChange={setAmount} />
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
                <LoadingButton
                  className="rounded-full animated-gradient-button text-white"
                  onClick={handleCreateBudget}
                  isLoading={isSubmitting}
                  loadingText="Menyimpan..."
                >
                  Simpan Anggaran
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

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

              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Memuat detail anggaran...</p>
                </div>
              ) : (
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
                          <CardTitle className="text-sm">Tanggal Pembuatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-medium">{selectedBudget.startDate}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Dibuat Oleh</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-medium">{selectedBudget.createdBy}</p>
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
                            <span className="font-medium">{formatRupiah(selectedBudget.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Terpakai:</span>
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
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Alokasi Tambahan:</span>
                            <span className="font-medium">{formatRupiah(selectedBudget.additionalAmount || 0)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span>Sisa Anggaran:</span>
                            <div className="text-right">
                              <span>{formatRupiah(selectedBudget.availableAmount)}</span>
                              {lastUpdate && lastUpdate.budgetId === selectedBudget.id && (
                                <div className="text-xs text-green-600 font-medium mt-1">Baru diperbarui</div>
                              )}
                            </div>
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
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
