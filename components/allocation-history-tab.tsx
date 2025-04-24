"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRupiah } from "@/lib/format-rupiah"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { sql, executeQueryWithRetry } from "@/lib/db"

interface AllocationHistoryTabProps {
  budgetId: string
}

export function AllocationHistoryTab({ budgetId }: AllocationHistoryTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [allocations, setAllocations] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await executeQueryWithRetry(
          () => sql`
          SELECT 
            a.id, 
            a.description, 
            a.amount, 
            a.request_date, 
            a.requested_by, 
            a.requested_at,
            a.reason
          FROM additional_allocations a
          WHERE a.original_budget_id = ${budgetId}
          ORDER BY a.requested_at DESC
        `,
        )

        setAllocations(result)
      } catch (error) {
        console.error("Error fetching allocation history:", error)
        setError("Failed to load allocation history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [budgetId])

  if (isLoading) {
    return <LoadingSpinner size="md" text="Memuat riwayat alokasi..." />
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (allocations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Tidak ada riwayat alokasi tambahan untuk anggaran ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Alokasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.map((allocation, index) => (
              <div
                key={allocation.id}
                className="flex justify-between items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="font-medium">{allocation.description}</h4>
                  <p className="text-sm text-muted-foreground">{allocation.reason}</p>
                  <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                    <span>{allocation.request_date}</span>
                    <span>•</span>
                    <span>Oleh: {allocation.requested_by}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatRupiah(allocation.amount)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(allocation.requested_at), "d MMMM yyyy, HH:mm", { locale: id })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
