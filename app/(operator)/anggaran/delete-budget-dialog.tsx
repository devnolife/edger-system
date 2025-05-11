"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { deleteBudget, deleteBudgetWithExpenses } from "@/app/actions/budget-actions"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import type { Budget } from "@/app/actions/budget-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DeleteBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  budget: Budget | null
}

export function DeleteBudgetDialog({ open, onOpenChange, onSuccess, budget }: DeleteBudgetDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteExpenses, setDeleteExpenses] = useState(false)

  // Handle budget deletion
  const handleDeleteBudget = async () => {
    // Clear previous errors
    setError(null)

    if (!budget) {
      setError("Data anggaran tidak ditemukan")
      return
    }

    setIsSubmitting(true)

    try {
      // Choose the appropriate deletion method based on user choice
      const result = deleteExpenses ? await deleteBudgetWithExpenses(budget.id) : await deleteBudget(budget.id)

      if (result.success) {
        let successMessage = "Anggaran berhasil dihapus"

        // Add details about deleted items if using deleteBudgetWithExpenses
        if (deleteExpenses && "deletedExpenses" in result) {
          successMessage += `. ${result.deletedExpenses} pengeluaran dan ${result.deletedAllocations} alokasi tambahan terkait juga dihapus.`
        }

        toast({
          title: "Berhasil",
          description: successMessage,
        })

        // Close dialog
        onOpenChange(false)

        // Notify parent component of success
        onSuccess()
      } else {
        setError(result.error || "Gagal menghapus anggaran")
        toast({
          title: "Error",
          description: result.error || "Gagal menghapus anggaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting budget:", error)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Hapus Anggaran</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Anggaran akan dihapus secara permanen.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="warning" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-600">Peringatan</AlertTitle>
            <AlertDescription className="text-yellow-600">
              Anda akan menghapus anggaran <span className="font-semibold">{budget?.name}</span> dengan ID{" "}
              <span className="font-semibold">{budget?.id}</span>.
            </AlertDescription>
          </Alert>

          {budget && budget.spentAmount > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-start space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <p className="text-sm font-medium">
                  Anggaran ini memiliki {budget.spentAmount.toLocaleString("id-ID")} pengeluaran terkait.
                </p>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="delete-expenses"
                  checked={deleteExpenses}
                  onCheckedChange={(checked) => setDeleteExpenses(checked === true)}
                />
                <Label
                  htmlFor="delete-expenses"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hapus semua pengeluaran terkait dengan anggaran ini
                </Label>
              </div>

              {!deleteExpenses && (
                <p className="text-xs text-gray-500 mt-2">
                  Jika tidak dicentang, penghapusan akan gagal jika anggaran memiliki pengeluaran terkait.
                </p>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <LoadingButton
            variant="destructive"
            className="rounded-full"
            onClick={handleDeleteBudget}
            isLoading={isSubmitting}
            loadingText="Menghapus..."
          >
            Hapus Anggaran
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
