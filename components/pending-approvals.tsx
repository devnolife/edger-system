"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Eye, X } from "lucide-react"
import { motion } from "framer-motion"

export function PendingApprovals() {
  const entries = [
    {
      id: "JE-2023-0046",
      date: "16/06/2023",
      description: "Biaya Pemasaran - Kampanye Q2",
      amount: 3500000,
      submittedBy: "John Doe",
    },
    {
      id: "JE-2023-0047",
      date: "16/06/2023",
      description: "Penggantian Perjalanan - Tim Penjualan",
      amount: 1250750,
      submittedBy: "Jane Smith",
    },
    {
      id: "JE-2023-0048",
      date: "15/06/2023",
      description: "Perpanjangan Langganan Software",
      amount: 899990,
      submittedBy: "Mike Johnson",
    },
  ]

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          className="flex flex-col space-y-3 rounded-xl border border-primary/20 bg-white dark:bg-black/40 p-4 hover:shadow-md transition-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{entry.description}</p>
                <Badge className="bg-secondary text-white rounded-full">Tertunda</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.id} • {entry.date} • Diajukan oleh {entry.submittedBy}
              </p>
            </div>
            <div className="font-medium">Rp{entry.amount.toLocaleString("id-ID")}</div>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" className="rounded-full">
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 rounded-full">
              <X className="mr-2 h-4 w-4" />
              Tolak
            </Button>
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 rounded-full">
              <Check className="mr-2 h-4 w-4" />
              Setujui
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
