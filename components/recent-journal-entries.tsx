"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { motion } from "framer-motion"

export function RecentJournalEntries() {
  const entries = [
    {
      id: "JE-2023-0045",
      date: "15/06/2023",
      description: "Pembelian Perlengkapan Kantor",
      amount: 245670,
      status: "diposting",
    },
    {
      id: "JE-2023-0044",
      date: "14/06/2023",
      description: "Pembayaran Klien - PT ABC",
      amount: 5000000,
      status: "diposting",
    },
    {
      id: "JE-2023-0043",
      date: "14/06/2023",
      description: "Pembayaran Sewa Bulanan",
      amount: 2500000,
      status: "diposting",
    },
    {
      id: "JE-2023-0042",
      date: "13/06/2023",
      description: "Tagihan Utilitas",
      amount: 350250,
      status: "diposting",
    },
  ]

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
            <p className="text-xs text-muted-foreground">{entry.date}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full">
              {entry.status}
            </Badge>
            <div className="font-medium text-sm">Rp{entry.amount.toLocaleString("id-ID")}</div>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
