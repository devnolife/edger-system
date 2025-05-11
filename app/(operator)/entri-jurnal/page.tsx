"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Search } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export default function EntriJurnal() {
  const { role } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const entries = [
    {
      id: "JE-2023-0048",
      date: "2023-06-15",
      description: "Perpanjangan Langganan Software",
      amount: 899990,
      status: "tertunda",
      createdBy: "Mike Johnson",
    },
    {
      id: "JE-2023-0047",
      date: "2023-06-16",
      description: "Penggantian Perjalanan - Tim Penjualan",
      amount: 1250750,
      status: "tertunda",
      createdBy: "Jane Smith",
    },
    {
      id: "JE-2023-0046",
      date: "2023-06-16",
      description: "Biaya Pemasaran - Kampanye Q2",
      amount: 3500000,
      status: "tertunda",
      createdBy: "John Doe",
    },
    {
      id: "JE-2023-0045",
      date: "2023-06-15",
      description: "Pembelian Perlengkapan Kantor",
      amount: 245670,
      status: "diposting",
      createdBy: "Sarah Williams",
    },
    {
      id: "JE-2023-0044",
      date: "2023-06-14",
      description: "Pembayaran Klien - PT ABC",
      amount: 5000000,
      status: "diposting",
      createdBy: "Robert Brown",
    },
    {
      id: "JE-2023-0043",
      date: "2023-06-14",
      description: "Pembayaran Sewa Bulanan",
      amount: 2500000,
      status: "diposting",
      createdBy: "Jane Smith",
    },
    {
      id: "JE-2023-0042",
      date: "2023-06-13",
      description: "Tagihan Utilitas",
      amount: 350250,
      status: "diposting",
      createdBy: "Mike Johnson",
    },
  ]

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || entry.id.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Entri Jurnal
          </h2>
          <p className="text-muted-foreground">Kelola dan lacak semua transaksi keuangan</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="rounded-full animated-gradient-button text-white">
            <Plus className="mr-2 h-4 w-4" />
            Entri Jurnal Baru
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari entri..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="tertunda">Tertunda</SelectItem>
            <SelectItem value="diposting">Diposting</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">ID Entri</TableHead>
                  <TableHead className="font-display">Tanggal</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="font-display">Dibuat Oleh</TableHead>
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
                {filteredEntries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    className="hover:bg-primary/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <TableCell className="font-medium">{entry.id}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.createdBy}</TableCell>
                    <TableCell className="text-right font-medium">Rp{entry.amount.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge
                        className="rounded-full"
                        variant={
                          entry.status === "diposting"
                            ? "outline"
                            : entry.status === "tertunda"
                              ? "secondary"
                              : entry.status === "ditolak"
                                ? "destructive"
                                : "default"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
