"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
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
import { AlertCircle } from "lucide-react"
import { updateBudget } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import type { Budget } from "@/app/actions/budget-actions"

interface EditBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  budget: Budget | null
}

export function EditBudgetDialog({ open, onOpenChange, onSuccess, budget }: EditBudgetDialogProps) {
  const { toast } = useToast()

  // Form state
  const [budgetName, setBudgetName] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form when budget changes
  useEffect(() => {
    if (budget) {
      setBudgetName(budget.name)
      setAmount(budget.amount.toString())
      setDescription(budget.description || "")
    }
  }, [budget])

  // Reset form
  const resetForm = () => {
    if (budget) {
      setBudgetName(budget.name)
      setAmount(budget.amount.toString())
      setDescription(budget.description || "")
    }
    setError(null)
  }

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // Handle budget update
  const handleUpdateBudget = async () => {
    // Clear previous errors
    setError(null)

    // Validate required fields
    if (!budgetName || !amount) {
      setError("Harap isi semua bidang yang diperlukan")
      return
    }

    if (!budget) {
      setError("Data anggaran tidak ditemukan")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", budgetName)
      formData.append("amount", amount)
      formData.append("description", description)

      const result = await updateBudget(budget.id, formData)

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Anggaran berhasil diperbarui",
        })

        // Reset form and close dialog
        resetForm()
        onOpenChange(false)

        // Notify parent component of success
        onSuccess()
      } else {
        setError(result.error || "Gagal memperbarui anggaran")
        toast({
          title: "Error",
          description: result.error || "Gagal memperbarui anggaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating budget:", error)
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
          <DialogTitle className="text-xl font-display">Edit Anggaran</DialogTitle>
          <DialogDescription>Perbarui detail anggaran. Klik simpan setelah selesai.</DialogDescription>
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
            <Label htmlFor="budget-id">ID Anggaran</Label>
            <Input id="budget-id" value={budget?.id || ""} className="rounded-lg bg-muted" disabled />
          </div>
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
            onClick={handleUpdateBudget}
            isLoading={isSubmitting}
            loadingText="Menyimpan..."
          >
            Simpan Perubahan
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
