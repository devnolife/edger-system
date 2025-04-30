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
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { deleteAdditionalAllocation } from "@/app/actions/allocation-actions"
import { formatRupiah } from "@/lib/format-rupiah"
import { AlertTriangle } from "lucide-react"

interface DeleteAllocationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  allocation: {
    id: string
    description: string
    amount: number
    spentAmount: number
  } | null
  onSuccess: () => void
}

export function DeleteAllocationDialog({ isOpen, onOpenChange, allocation, onSuccess }: DeleteAllocationDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!allocation) return

    setIsSubmitting(true)

    try {
      const result = await deleteAdditionalAllocation(allocation.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Additional allocation deleted successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete additional allocation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting additional allocation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!allocation) return null

  const hasSpentAmount = allocation.spentAmount > 0

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Hapus Alokasi Anggaran Tambahan</DialogTitle>
          <DialogDescription>Apakah Anda yakin ingin menghapus alokasi anggaran tambahan ini?</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">{allocation.description}</h4>
            <p className="text-sm text-muted-foreground mb-2">ID: {allocation.id}</p>
            <p className="font-medium">{formatRupiah(allocation.amount)}</p>
          </div>

          {hasSpentAmount && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-lg mb-4">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Peringatan</p>
                <p className="text-sm">
                  Alokasi ini memiliki pengeluaran terkait sebesar {formatRupiah(allocation.spentAmount)}. Menghapus
                  alokasi ini dapat menyebabkan inkonsistensi data.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <LoadingButton
            variant="destructive"
            className="rounded-full"
            onClick={handleDelete}
            isLoading={isSubmitting}
            loadingText="Menghapus..."
          >
            Hapus Alokasi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
