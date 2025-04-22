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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Check, FileText, Plus, Search, X } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { useUserRole } from "@/hooks/use-user-role"
import { BudgetService, type AdditionalAllocation, type Budget } from "@/lib/budget-service"

export default function AnggaranTambahan() {
  const { role, user } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [date, setDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<AdditionalAllocation | null>(null)

  // Form state
  const [selectedBudget, setSelectedBudget] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const additionalBudgets: AdditionalAllocation[] = [
    {
      id: "ADD-2023-001",
      originalBudgetId: "BDG-2023-001",
      originalBudgetName: "Anggaran Operasional Q3 2023",
      description: "Tambahan untuk biaya operasional tak terduga",
      reason: "Peningkatan biaya pemeliharaan gedung karena kerusakan sistem pendingin",
      requestDate: "2023-08-10",
      amount: 15000000,
      department: "Operasional",
      status: "approved",
      approvedBy: "Admin Pengguna",
      approvedAt: "2023-08-12T14:30:00Z",
      requestedBy: "Sarah Williams",
      requestedAt: "2023-08-10T09:15:00Z",
      availableAmount: 5000000,
      spentAmount: 10000000,
    },
    {
      id: "ADD-2023-002",
      originalBudgetId: "BDG-2023-002",
      originalBudgetName: "Anggaran Pemasaran Q3 2023",
      description: "Tambahan untuk kampanye pemasaran baru",
      reason: "Peluang iklan mendadak untuk acara nasional yang tidak direncanakan sebelumnya",
      requestDate: "2023-08-15",
      amount: 10000000,
      department: "Pemasaran",
      status: "pending",
      requestedBy: "John Doe",
      requestedAt: "2023-08-15T11:30:00Z",
      availableAmount: 10000000,
      spentAmount: 0,
    },
    {
      id: "ADD-2023-003",
      originalBudgetId: "BDG-2023-003",
      originalBudgetName: "Anggaran Pengembangan IT Q3 2023",
      description: "Tambahan untuk pembelian lisensi software tambahan",
      reason: "Kebutuhan mendadak untuk lisensi tambahan akibat reorganisasi departemen",
      requestDate: "2023-08-18",
      amount: 20000000,
      department: "IT",
      status: "pending",
      requestedBy: "Mike Johnson",
      requestedAt: "2023-08-18T10:45:00Z",
      availableAmount: 20000000,
      spentAmount: 0,
      relatedExpenseId: "EXP-2023-0005",
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

  const filteredAdditionalBudgets = additionalBudgets.filter((budget) => {
    const matchesSearch =
      budget.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.id.includes(searchTerm) ||
      budget.originalBudgetName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || budget.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const canApprove = role === "superadmin" || role === "admin"

  // Handle allocation submission
  const handleSubmitAllocation = () => {
    if (!selectedBudget || !amount || !reason || !description || !date) {
      // In a real app, show validation errors
      return
    }

    const newAllocation: AdditionalAllocation = {
      id: BudgetService.generateId("ADD"),
      originalBudgetId: selectedBudget,
      originalBudgetName: budgets.find((b) => b.id === selectedBudget)?.name || "",
      description,
      reason,
      amount: Number.parseFloat(amount),
      requestDate: date.toISOString().split("T")[0],
      status: "pending",
      requestedBy: user?.name || "Unknown User",
      requestedAt: new Date().toISOString(),
      department: budgets.find((b) => b.id === selectedBudget)?.department || "",
      availableAmount: Number.parseFloat(amount),
      spentAmount: 0,
    }

    // In a real app, save to database
    console.log("New allocation created:", newAllocation)

    // Reset form and close dialog
    setSelectedBudget("")
    setAmount("")
    setReason("")
    setDescription("")
    setDate(undefined)
    setIsDialogOpen(false)
  }

  // Open allocation details
  const openAllocationDetails = (allocation: AdditionalAllocation) => {
    setSelectedAllocation(allocation)
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
            Anggaran Tambahan
          </h2>
          <p className="text-muted-foreground">Kelola permintaan anggaran tambahan untuk anggaran yang sudah ada</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="rounded-full animated-gradient-button text-white">
                <Plus className="mr-2 h-4 w-4" />
                Ajukan Anggaran Tambahan
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Ajukan Anggaran Tambahan</DialogTitle>
              <DialogDescription>
                Isi detail permintaan anggaran tambahan. Klik simpan setelah selesai.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="original-budget">Anggaran Asal</Label>
                <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                  <SelectTrigger id="original-budget" className="rounded-lg">
                    <SelectValue placeholder="Pilih anggaran asal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} ({budget.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBudget && (
                <div className="p-3 bg-muted rounded-lg mb-2">
                  <p className="text-sm font-medium">Informasi Anggaran</p>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Anggaran Awal:</span>
                    <span className="font-medium">
                      Rp{budgets.find((b) => b.id === selectedBudget)?.amount.toLocaleString("id-ID") || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Sisa Anggaran:</span>
                    <span className="font-medium">
                      Rp{budgets.find((b) => b.id === selectedBudget)?.availableAmount.toLocaleString("id-ID") || 0}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Tambahan</Label>
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
                <Label>Tanggal Pengajuan</Label>
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
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  placeholder="Deskripsi singkat anggaran tambahan"
                  className="rounded-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Permintaan</Label>
                <Textarea
                  id="reason"
                  placeholder="Jelaskan alasan permintaan anggaran tambahan"
                  className="rounded-lg"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button className="rounded-full animated-gradient-button text-white" onClick={handleSubmitAllocation}>
                Ajukan Permintaan
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
            placeholder="Cari anggaran tambahan..."
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
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">
                  Total Anggaran Tambahan
                </CardTitle>
                <div className="text-2xl font-bold">Rp45.000.000</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Disetujui</CardTitle>
                <div className="text-2xl font-bold">Rp15.000.000</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Tertunda</CardTitle>
                <div className="text-2xl font-bold">Rp30.000.000</div>
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
                  <TableHead className="font-display">Anggaran Asal</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Tanggal Pengajuan</TableHead>
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
                {filteredAdditionalBudgets.map((budget, index) => {
                  // Calculate usage percentage
                  const percentUsed = budget.spentAmount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0

                  // Is this related to an expense?
                  const isExpenseRelated = !!budget.relatedExpenseId

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
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full">
                          {budget.originalBudgetName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {budget.description}
                          {isExpenseRelated && (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-300 rounded-full text-xs"
                            >
                              Auto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{budget.requestDate}</TableCell>
                      <TableCell>{budget.department}</TableCell>
                      <TableCell className="text-right font-medium">
                        Rp{budget.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full"
                          variant={
                            budget.status === "approved"
                              ? "outline"
                              : budget.status === "pending"
                                ? "secondary"
                                : budget.status === "rejected"
                                  ? "destructive"
                                  : "default"
                          }
                        >
                          {budget.status === "approved"
                            ? "Disetujui"
                            : budget.status === "pending"
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
                            onClick={() => openAllocationDetails(budget)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canApprove && budget.status === "pending" && (
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

      {/* Allocation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          {selectedAllocation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Detail Alokasi Tambahan</DialogTitle>
                <DialogDescription>
                  {selectedAllocation.id} - {selectedAllocation.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Tanggal Pengajuan</h4>
                    <p className="text-base">{selectedAllocation.requestDate}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <Badge
                      className="mt-1 rounded-full"
                      variant={
                        selectedAllocation.status === "approved"
                          ? "outline"
                          : selectedAllocation.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {selectedAllocation.status === "approved"
                        ? "Disetujui"
                        : selectedAllocation.status === "pending"
                          ? "Tertunda"
                          : "Ditolak"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Anggaran Asal</h4>
                  <p className="text-base">{selectedAllocation.originalBudgetName}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Jumlah</h4>
                  <p className="text-lg font-semibold">Rp{selectedAllocation.amount.toLocaleString("id-ID")}</p>
                </div>

                {selectedAllocation.status === "approved" && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Penggunaan</h4>
                    <div className="mt-2 space-y-1">
                      <Progress
                        value={(selectedAllocation.spentAmount / selectedAllocation.amount) * 100}
                        className="h-2 rounded-full"
                      />
                      <div className="flex justify-between text-xs">
                        <span>Terpakai: Rp{selectedAllocation.spentAmount.toLocaleString("id-ID")}</span>
                        <span>Tersisa: Rp{selectedAllocation.availableAmount.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Departemen</h4>
                  <p className="text-base">{selectedAllocation.department}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Alasan</h4>
                  <p className="text-base mt-1">{selectedAllocation.reason}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Diajukan Oleh</h4>
                    <p className="text-base">{selectedAllocation.requestedBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedAllocation.requestedAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedAllocation.approvedBy && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Disetujui Oleh</h4>
                      <p className="text-base">{selectedAllocation.approvedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedAllocation.approvedAt && new Date(selectedAllocation.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Show related expense if any */}
                {selectedAllocation.relatedExpenseId && (
                  <div>
                    <Separator />
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-blue-600">Terkait dengan Pengeluaran</h4>
                      <p className="text-sm mt-1">ID Pengeluaran: {selectedAllocation.relatedExpenseId}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Alokasi ini dibuat otomatis karena pengeluaran melebihi anggaran yang tersedia
                      </p>
                    </div>
                  </div>
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
