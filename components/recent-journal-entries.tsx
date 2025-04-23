"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { motion } from "framer-motion"
import { getRecentTransactions } from "@/app/actions/dashboard-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatRupiah } from "@/lib/format-rupiah"

export function RecentJournalEntries() {
  const [entries, setEntries] = useState<
    {
      id: string
      description: string
      date: string
      amount: number
    }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getRecentTransactions(4) // Get 4 recent transactions
        if (result.success && result.transactions) {
          setEntries(result.transactions)
        } else {
          setError(result.error || "Failed to fetch transactions")
          setEntries([]) // Empty array if there's an error
        }
      } catch (error) {
        console.error("Error in RecentJournalEntries:", error)
        setError("An unexpected error occurred")
        setEntries([]) // Empty array if there's an error
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <LoadingSpinner size="md" text="Memuat data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground">
        <p>Gagal memuat data: {error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground">
        <p>Belum ada entri jurnal</p>
      </div>
    )
  }

  // Format date to Indonesian format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          className="flex items-center justify-between space-x-4 p-3 rounded-xl bg-white dark:bg-black/40 hover:bg-primary/5 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{entry.description}</p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full">
              diposting
            </Badge>
            <div className="font-medium text-sm">{formatRupiah(entry.amount)}</div>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" asChild>
              <a href={`/pengeluaran?expense=${entry.id}`}>
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
