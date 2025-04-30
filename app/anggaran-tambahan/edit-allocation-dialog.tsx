"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RupiahInput } from "@/components/ui/rupiah-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { updateAdditionalAllocation } from "@/app/actions/allocation-actions"
import { getBudgets } from "@/app/actions/budget-actions"

interface EditAllocationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  allocation: {
    id: string
    originalBudgetId: string
    description: string
    reason: string
    amount: number
    requestDate: string
  } | null
  onSuccess: () => void
}

export function EditAllocationDialog({ isOpen, onOpenChange, allocation, onSuccess }: EditAllocationDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [budgets, setBudgets] = useState<{ id: string; name: string }[]>([])

  // Form state
  const [originalBudgetId, setOriginalBudgetId] = useState("")
  const [description, setDescription] = useState("")
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState("")
  const [requestDate, setRequestDate] = useState<Date>()

  // Fetch budgets on component mount
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const budgetsResult = await getBudgets()
        if (budgetsResult.success) {
          setBudgets(budgetsResult.budgets.map((budget) => ({ id: budget.id, name: budget.name })))
        }
      } catch (error) {
        console.error("Error fetching budgets:", error)
      }
    }

    fetchBudgets()
  }, [])

  // Set form values when allocation changes
  useEffect(() => {
    if (allocation) {
      setOriginalBudgetId(allocation.originalBudgetId)
      setDescription(allocation.description)
      setReason(allocation.reason)
      setAmount(allocation.amount.toString())
      setRequestDate(new Date(allocation.requestDate))
    }
  }, [allocation])

  const handleSubmit = async () => {
    if (!allocation) return

    if (!originalBudgetId || !description || !reason || !amount || !requestDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("id", allocation.id)
      formData.append("originalBudgetId", originalBudgetId)
      formData.append("description", description)
      formData.append("reason", reason)
      formData.append("amount", amount)
      formData.append("requestDate", requestDate.toISOString().split("T")[0])

      const result = await updateAdditionalAllocation(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Additional allocation updated successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update additional allocation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating additional allocation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Edit Alokasi Anggaran Tambahan</DialogTitle>
          <DialogDescription>Ubah detail alokasi tambahan. Klik simpan setelah selesai.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Anggaran Asal</Label>
            <Select value={originalBudgetId} onValueChange={setOriginalBudgetId}>
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
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <LoadingButton
            className="rounded-full animated-gradient-button text-white"
            onClick={handleSubmit}
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
