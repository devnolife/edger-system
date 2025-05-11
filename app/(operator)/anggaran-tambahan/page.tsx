"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Eye, Plus, Search, Edit, Trash } from "lucide-react"
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
  getAllocationSummary,
  type AdditionalAllocation,
} from "@/app/actions/allocation-actions"
import { getBudgets } from "@/app/actions/budget-actions"
import { getExpenseById } from "@/app/actions/expense-actions"
import { LoadingButton } from "@/components/ui/loading-button"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { CheckCircle2, ArrowRight } from "lucide-react"
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineHeader,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"
import { EditAllocationDialog } from "./edit-allocation-dialog"
import { DeleteAllocationDialog } from "./delete-allocation-dialog"

export default function AnggaranTambahan() {
  const { role, user } = useUserRole()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const budgetIdParam = searchParams.get("budget")
  const expenseIdParam = searchParams.get("expense")

  const [searchTerm, setSearchTerm] = useState("")
  const [requestDate, setRequestDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<AdditionalAllocation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [allocations, setAllocations] = useState<AdditionalAllocation[]>([])
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    count: 0,
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

  // Filter allocations based on search and budget
  const filteredAllocations = allocations.filter((allocation) => {
    const matchesSearch =
      allocation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.id.includes(searchTerm) ||
      allocation.originalBudgetName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBudget = !budgetIdParam || allocation.originalBudgetId === budgetIdParam

    return matchesSearch && matchesBudget
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
      setIsProcessing(true)
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
    } finally {
      setIsProcessing(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (allocation: AdditionalAllocation) => {
    setSelectedAllocation(allocation)
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (allocation: AdditionalAllocation) => {
    setSelectedAllocation(allocation)
    setIsDeleteDialogOpen(true)
  }

  // Handle successful action (edit or delete)
  const handleActionSuccess = async () => {
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
          <p className="text-muted-foreground">Kelola alokasi anggaran tambahan</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">
                  Jumlah Item Anggaran Tambahan
                </CardTitle>
                <div className="text-2xl font-bold">{summary.count} item</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
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
                      <p className="mt-2 text-muted-foreground">Memuat data alokasi...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => openAllocationDetails(allocation)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canManageAllocations && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => openEditDialog(allocation)}
                              title="Edit Alokasi"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {role === "superadmin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteDialog(allocation)}
                              title="Hapus Alokasi"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
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
        <DialogContent className="sm:max-w-[650px] rounded-2xl p-0 overflow-hidden">
          {selectedAllocation && (
            <div className="flex flex-col h-full">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                <DialogTitle className="text-xl font-display mb-1">{selectedAllocation.description}</DialogTitle>
                <DialogDescription className="text-white/80 opacity-90">
                  {formatRupiah(selectedAllocation.amount)} • {selectedAllocation.requestDate}
                </DialogDescription>
              </div>

              <Tabs defaultValue="details" className="flex-1">
                <div className="px-6 pt-4">
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
                </div>

                {/* Details Tab - Streamlined */}
                <TabsContent value="details" className="p-6 pt-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">ID Alokasi</div>
                      <div className="font-medium text-sm">{selectedAllocation.id}</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Anggaran Asal</div>
                      <div className="font-medium text-sm">{selectedAllocation.originalBudgetName}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Alasan Permintaan</h4>
                      <p className="text-sm">{selectedAllocation.reason}</p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Informasi Tambahan</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Dibuat Oleh</div>
                          <div>{selectedAllocation.requestedBy}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Tanggal Pembuatan</div>
                          <div>{new Date(selectedAllocation.requestedAt).toLocaleDateString("id-ID")}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Timeline</h4>
                      <Timeline className="max-h-[180px] overflow-y-auto pr-2">
                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot color="green">
                              <CheckCircle2 className="h-3 w-3" />
                            </TimelineDot>
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>
                            <TimelineHeader>
                              <TimelineTitle className="text-sm">Alokasi Dibuat</TimelineTitle>
                            </TimelineHeader>
                            <p className="text-xs text-muted-foreground">
                              Oleh {selectedAllocation.requestedBy} pada{" "}
                              {new Date(selectedAllocation.requestedAt).toLocaleString("id-ID")}
                            </p>
                          </TimelineContent>
                        </TimelineItem>

                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot color="green">
                              <CheckCircle2 className="h-3 w-3" />
                            </TimelineDot>
                          </TimelineSeparator>
                          <TimelineContent>
                            <TimelineHeader>
                              <TimelineTitle className="text-sm">Alokasi Diproses</TimelineTitle>
                            </TimelineHeader>
                            <p className="text-xs text-muted-foreground">
                              Diproses secara otomatis pada{" "}
                              {new Date(selectedAllocation.approvedAt || selectedAllocation.requestedAt).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </TimelineContent>
                        </TimelineItem>

                        {selectedAllocation.relatedExpenseId && (
                          <TimelineItem>
                            <TimelineSeparator>
                              <TimelineDot color="purple">
                                <ArrowRight className="h-3 w-3" />
                              </TimelineDot>
                            </TimelineSeparator>
                            <TimelineContent>
                              <TimelineHeader>
                                <TimelineTitle className="text-sm">Terhubung dengan Pengeluaran</TimelineTitle>
                              </TimelineHeader>
                              <p className="text-xs text-muted-foreground">
                                Alokasi ini terhubung dengan pengeluaran {selectedAllocation.relatedExpenseId}
                              </p>
                            </TimelineContent>
                          </TimelineItem>
                        )}
                      </Timeline>
                    </div>
                  </div>
                </TabsContent>

                {/* Related Expense Tab - Streamlined */}
                <TabsContent value="related" className="p-6 pt-4">
                  {selectedAllocation.relatedExpense ? (
                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium">Detail Pengeluaran</h4>
                          <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {selectedAllocation.relatedExpenseId}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Deskripsi</div>
                            <p className="text-sm">{selectedAllocation.relatedExpense.description}</p>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Jumlah</div>
                            <p className="text-sm font-medium">
                              {formatRupiah(selectedAllocation.relatedExpense.amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button className="rounded-full text-sm px-4 h-9" asChild>
                          <a href={`/pengeluaran?expense=${selectedAllocation.relatedExpenseId}`}>
                            Lihat Detail Pengeluaran
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="bg-muted/50 rounded-full p-3 mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Alokasi ini tidak terkait dengan pengeluaran tertentu
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <EditAllocationDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        allocation={selectedAllocation}
        onSuccess={handleActionSuccess}
      />

      {/* Delete Allocation Dialog */}
      <DeleteAllocationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        allocation={selectedAllocation}
        onSuccess={handleActionSuccess}
      />

      {/* Add the loading overlay */}
      <LoadingOverlay
        isLoading={isProcessing}
        text={isSubmitting ? "Menyimpan alokasi baru..." : "Memproses permintaan..."}
      />
    </motion.div>
  )
}
