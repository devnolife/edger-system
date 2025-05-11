"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { createBudget } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"

interface CreateBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userName: string
}

export function CreateBudgetDialog({ open, onOpenChange, onSuccess, userName }: CreateBudgetDialogProps) {
  const { toast } = useToast()

  // Form state
  const [budgetName, setBudgetName] = useState("")
  const [amount, setAmount] = useState("")
  const [creationDate, setCreationDate] = useState<Date>(new Date())
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form
  const resetForm = () => {
    setBudgetName("")
    setAmount("")
    setCreationDate(new Date())
    setDescription("")
    setError(null)
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // Handle budget creation
  const handleCreateBudget = async () => {
    // Clear previous errors
    setError(null)

    // Validate required fields
    if (!budgetName || !amount || !creationDate) {
      setError("Harap isi semua bidang yang diperlukan")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", budgetName)
      formData.append("amount", amount)
      formData.append("creationDate", creationDate.toISOString().split("T")[0])
      formData.append("description", description)
      formData.append("createdBy", userName || "Unknown User")

      const result = await createBudget(formData)

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Anggaran berhasil dibuat",
        })

        // Reset form and close dialog
        resetForm()
        onOpenChange(false)

        // Notify parent component of success
        onSuccess()
      } else {
        setError(result.error || "Gagal membuat anggaran")
        toast({
          title: "Error",
          description: result.error || "Gagal membuat anggaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating budget:", error)
      setError("Terjadi kesalahan yang tidak terduga")
      toast({
        title: "Error",
        description: "Terjadi kesalahan yang tidak terduga",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Buat Anggaran Baru</DialogTitle>
          <DialogDescription>Isi detail anggaran baru. Klik simpan setelah selesai.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                  onSelect={(date) => date && setCreationDate(date)}
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
          <Button variant="outline" className="rounded-full" onClick={() => handleOpenChange(false)}>
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
  )
}
