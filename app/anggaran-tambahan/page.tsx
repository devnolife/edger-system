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
  getAdditionalAllocations,
  createAdditionalAllocation,
  getAdditionalAllocationById,
  updateAllocationStatus,
  getAllocationSummary,
  type AdditionalAllocation,
  type AllocationStatus,
} from "@/app/actions/allocation-actions"
import { getBudgets } from "@/app/actions/budget-actions"
import { getExpenseById } from "@/app/actions/expense-actions"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

export default function AnggaranTambahan() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budget")
  const expenseIdParam = searchParams.get("expense")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [requestDate, setRequestDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedAllocation, setSelectedAllocation] = useState<AdditionalAllocation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allocations, setAllocations] = useState<AdditionalAllocation[]>([])
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  })

  // Form state
  const [originalBudgetId, setOriginalBudgetId] = useState(budgetIdParam || "")
  const [description, setDescription] = useState("")
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState("")
  const [relatedExpenseId, setRelatedExpenseId] = useState(expenseIdParam || "")
  const [relatedExpenseDetails, setRelatedExpenseDetails] = useState<{
    description: string
    amount: number
    budgetId: string
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch allocations, budgets, and summary on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch allocations
        const allocationsResult = await getAdditionalAllocations()
        if (allocationsResult.success) {
          setAllocations(allocationsResult.allocations)
        } else {
          toast({
            title: "Error",
            description: allocationsResult.error || "Failed to fetch allocations",
            variant: "destructive",
          })
        }

        // Fetch budgets for the dropdown
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets.map((budget) => ({ id: budget.id, name: budget.name })))
        }

        // Fetch summary
        const summaryResult = await getAllocationSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // If there's an expense ID in the URL, fetch its details
        if (expenseIdParam) {
          const expenseResult = await getExpenseById(expenseIdParam)
          if (expenseResult.success) {
            setRelatedExpenseDetails({
              description: expenseResult.expense.description,
              amount: expenseResult.expense.amount,
              budgetId: expenseResult.expense.budgetId,
            })
            setOriginalBudgetId(expenseResult.expense.budgetId)
            setDescription(`Alokasi tambahan untuk: ${expenseResult.expense.description}`)
            setReason("Pengeluaran melebihi anggaran yang tersedia")
            setAmount(expenseResult.expense.amount.toString())
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

  // Filter allocations based on tab, search, status, and department
  const filteredAllocations = allocations.filter((allocation) => {
    const matchesTab =
      (activeTab === "pending" && allocation.status === "pending") ||
      (activeTab === "approved" && allocation.status === "approved") ||
      (activeTab === "rejected" && allocation.status === "rejected") ||
      activeTab === "all"

    const matchesSearch =
      allocation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.id.includes(searchTerm) ||
      allocation.originalBudgetName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || allocation.status === statusFilter

    const matchesBudget = !budgetIdParam || allocation.originalBudgetId === budgetIdParam

    return matchesTab && matchesSearch && matchesStatus && matchesBudget
  })

  // Handle allocation creation
  const handleCreateAllocation = async () => {
    if (!originalBudgetId || !description || !reason || !amount || !requestDate) {
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
    formData.append("originalBudgetId", originalBudgetId)
    formData.append("description", description)
    formData.append("reason", reason)
    formData.append("amount", amount)
    formData.append("requestDate", requestDate.toISOString().split("T")[0])
    formData.append("requestedBy", user?.name || "Unknown User")
    if (relatedExpenseId) {
      formData.append("relatedExpenseId", relatedExpenseId)
    }

    try {
      const result = await createAdditionalAllocation(formData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Additional allocation created successfully",
        })

        // Refresh allocations
        const allocationsResult = await getAdditionalAllocations()
        if (allocationsResult.success) {
          setAllocations(allocationsResult.allocations)
        }

        // Refresh summary
        const summaryResult = await getAllocationSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // Reset form and close dialog
        setOriginalBudgetId(budgetIdParam || "")
        setDescription("")
        setReason("")
        setAmount("")
        setRequestDate(undefined)
        setRelatedExpenseId("")
        setRelatedExpenseDetails(null)
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create additional allocation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating additional allocation:", error)
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

  // Open allocation details
  const openAllocationDetails = async (allocation: AdditionalAllocation) => {
    try {
      const result = await getAdditionalAllocationById(allocation.id)
      if (result.success) {
        setSelectedAllocation(result.allocation)
        setIsDetailsOpen(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch allocation details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching allocation details:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle allocation approval or rejection
  const handleUpdateStatus = async (id: string, status: AllocationStatus) => {
    try {
      if (status === "approved") {
        setIsApproving(true)
      } else {
        setIsRejecting(true)
      }
      setIsProcessing(true)

      const result = await updateAllocationStatus(id, status, user?.name || "Unknown User")
      if (result.success) {
        toast({
          title: "Success",
          description: `Allocation ${status === "approved" ? "approved" : "rejected"} successfully`,
        })

        // Refresh allocations
        const allocationsResult = await getAdditionalAllocations()
        if (allocationsResult.success) {
          setAllocations(allocationsResult.allocations)
        }

        // Refresh summary
        const summaryResult = await getAllocationSummary()
        if (summaryResult.success) {
          setSummary(summaryResult.summary)
        }

        // Close details dialog
        setIsDetailsOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${status} allocation`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error ${status} allocation:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
      setIsRejecting(false)
      setIsProcessing(false)
    }
  }

  const canManageAllocations = role === "superadmin" || role === "admin" || role === "finance"

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
            Alokasi Anggaran Tambahan
          </h2>
          <p className="text-muted-foreground">Kelola permintaan alokasi anggaran tambahan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="rounded-full animated-gradient-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                Buat Alokasi Tambahan
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Buat Alokasi Anggaran Tambahan</DialogTitle>
              <DialogDescription>Isi detail alokasi tambahan. Klik simpan setelah selesai.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Anggaran Asal</Label>
                <Select value={originalBudgetId} onValueChange={setOriginalBudgetId} disabled={!!relatedExpenseDetails}>
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
              </div>

              {relatedExpenseDetails && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Terkait dengan Pengeluaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">ID:</span> {relatedExpenseId}
                      </p>
                      <p>
                        <span className="font-medium">Deskripsi:</span> {relatedExpenseDetails.description}
                      </p>
                      <p>
                        <span className="font-medium">Jumlah:</span> {formatRupiah(relatedExpenseDetails.amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Alokasi</Label>
                <Input
                  id="description"
                  placeholder="Masukkan deskripsi alokasi"
                  className="rounded-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Permintaan</Label>
                <Textarea
                  id="reason"
                  placeholder="Jelaskan alasan permintaan alokasi tambahan"
                  className="rounded-lg"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Alokasi</Label>
                  <RupiahInput id="amount" placeholder="0" className="rounded-lg" value={amount} onChange={setAmount} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Permintaan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-lg">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {requestDate ? format(requestDate, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={requestDate}
                        onSelect={setRequestDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <LoadingButton
                className="rounded-full animated-gradient-button text-white"
                onClick={handleCreateAllocation}
                isLoading={isSubmitting}
                loadingText="Menyimpan..."
              >
                Simpan Alokasi
              </LoadingButton>
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
            placeholder="Cari alokasi..."
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
      <motion.div variants={container} className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Alokasi</CardTitle>
                <div className="text-2xl font-bold">{formatRupiah(summary.total)}</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Alokasi Disetujui</CardTitle>
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
      </motion.div>

      {/* Allocation Tabs */}
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

      {/* Allocation Table */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">ID</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Anggaran Asal</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                      <p className="mt-2 text-muted-foreground">Memuat data alokasi...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Tidak ada data alokasi yang ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((allocation, index) => (
                    <motion.tr
                      key={allocation.id}
                      className="hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <TableCell className="font-medium">{allocation.id}</TableCell>
                      <TableCell>{allocation.description}</TableCell>
                      <TableCell>{allocation.originalBudgetName}</TableCell>
                      <TableCell>{allocation.requestDate}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupiah(allocation.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full"
                          variant={
                            allocation.status === "approved"
                              ? "default"
                              : allocation.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {allocation.status === "approved"
                            ? "Disetujui"
                            : allocation.status === "rejected"
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
                            onClick={() => openAllocationDetails(allocation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageAllocations && allocation.status === "pending" && (
                            <>
                              <LoadingButton
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                                onClick={() => handleUpdateStatus(allocation.id, "approved")}
                                isLoading={isApproving}
                                loadingText="Menyetujui..."
                              >
                                <Check className="h-4 w-4" />
                              </LoadingButton>
                              <LoadingButton
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(allocation.id, "rejected")}
                                isLoading={isRejecting}
                                loadingText="Menolak..."
                              >
                                <X className="h-4 w-4" />
                              </LoadingButton>
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

      {/* Allocation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl">
          {selectedAllocation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display">{selectedAllocation.description}</DialogTitle>
                <DialogDescription>Detail alokasi anggaran tambahan</DialogDescription>
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
                    value="related"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Pengeluaran Terkait
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">ID Alokasi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{selectedAllocation.id}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Anggaran Asal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{selectedAllocation.originalBudgetName}</p>
                        <p className="text-xs text-muted-foreground">{selectedAllocation.originalBudgetId}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Tanggal Permintaan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{selectedAllocation.requestDate}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Jumlah</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-medium">{formatRupiah(selectedAllocation.amount)}</p>
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
                            selectedAllocation.status === "approved"
                              ? "default"
                              : selectedAllocation.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {selectedAllocation.status === "approved"
                            ? "Disetujui"
                            : selectedAllocation.status === "rejected"
                              ? "Ditolak"
                              : "Tertunda"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alasan Permintaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedAllocation.reason}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informasi Tambahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Diminta Oleh</h4>
                          <p>{selectedAllocation.requestedBy}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Tanggal Pengajuan</h4>
                          <p>{new Date(selectedAllocation.requestedAt).toLocaleString("id-ID")}</p>
                        </div>
                        {selectedAllocation.approvedBy && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Disetujui/Ditolak Oleh</h4>
                            <p>{selectedAllocation.approvedBy}</p>
                          </div>
                        )}
                        {selectedAllocation.approvedAt && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Tanggal Persetujuan/Penolakan</h4>
                            <p>{new Date(selectedAllocation.approvedAt).toLocaleString("id-ID")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {canManageAllocations && selectedAllocation.status === "pending" && (
                    <div className="flex justify-end gap-4 mt-4">
                      <LoadingButton
                        variant="outline"
                        className="rounded-full border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedAllocation.id, "rejected")}
                        isLoading={isRejecting}
                        loadingText="Menolak..."
                      >
                        <X className="mr-2 h-4 w-4" />
                        Tolak Alokasi
                      </LoadingButton>
                      <LoadingButton
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleUpdateStatus(selectedAllocation.id, "approved")}
                        isLoading={isApproving}
                        loadingText="Menyetujui..."
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Setujui Alokasi
                      </LoadingButton>
                    </div>
                  )}
                </TabsContent>

                {/* Related Expense Tab */}
                <TabsContent value="related" className="mt-4">
                  {selectedAllocation.relatedExpense ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detail Pengeluaran Terkait</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">ID Pengeluaran</h4>
                            <p>{selectedAllocation.relatedExpenseId}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Deskripsi</h4>
                            <p>{selectedAllocation.relatedExpense.description}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Jumlah</h4>
                            <p className="font-medium">{formatRupiah(selectedAllocation.relatedExpense.amount)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Status Pengeluaran</h4>
                            <Badge
                              className="rounded-full mt-1"
                              variant={
                                selectedAllocation.relatedExpense.status === "approved"
                                  ? "default"
                                  : selectedAllocation.relatedExpense.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {selectedAllocation.relatedExpense.status === "approved"
                                ? "Disetujui"
                                : selectedAllocation.relatedExpense.status === "rejected"
                                  ? "Ditolak"
                                  : "Tertunda"}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-6">
                          <Button className="rounded-full" asChild>
                            <a href={`/pengeluaran?expense=${selectedAllocation.relatedExpenseId}`}>
                              Lihat Detail Pengeluaran
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-muted-foreground">Alokasi ini tidak terkait dengan pengeluaran tertentu</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Add the loading overlay */}
      <LoadingOverlay isLoading={isProcessing} text="Memproses permintaan..." />
    </motion.div>
  )
}
