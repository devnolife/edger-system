"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, Search } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"

export default function BukuBesar() {
  const [searchTerm, setSearchTerm] = useState("")
  const [accountFilter, setAccountFilter] = useState("all")
  const [date, setDate] = useState<Date>()

  const transactions = [
    {
      id: "TX-2023-0001",
      date: "2023-06-15",
      journalEntry: "JE-2023-0045",
      account: "Beban Perlengkapan Kantor",
      accountCode: "6100",
      debit: 245670,
      credit: 0,
      balance: 245670,
      description: "Pembelian Perlengkapan Kantor",
    },
    {
      id: "TX-2023-0002",
      date: "2023-06-15",
      journalEntry: "JE-2023-0045",
      account: "Kas",
      accountCode: "1000",
      debit: 0,
      credit: 245670,
      balance: -245670,
      description: "Pembelian Perlengkapan Kantor",
    },
    {
      id: "TX-2023-0003",
      date: "2023-06-14",
      journalEntry: "JE-2023-0044",
      account: "Kas",
      accountCode: "1000",
      debit: 5000000,
      credit: 0,
      balance: 4754330,
      description: "Pembayaran Klien - PT ABC",
    },
    {
      id: "TX-2023-0004",
      date: "2023-06-14",
      journalEntry: "JE-2023-0044",
      account: "Piutang Usaha",
      accountCode: "1100",
      debit: 0,
      credit: 5000000,
      balance: -5000000,
      description: "Pembayaran Klien - PT ABC",
    },
    {
      id: "TX-2023-0005",
      date: "2023-06-14",
      journalEntry: "JE-2023-0043",
      account: "Beban Sewa",
      accountCode: "6000",
      debit: 2500000,
      credit: 0,
      balance: 2500000,
      description: "Pembayaran Sewa Bulanan",
    },
    {
      id: "TX-2023-0006",
      date: "2023-06-14",
      journalEntry: "JE-2023-0043",
      account: "Kas",
      accountCode: "1000",
      debit: 0,
      credit: 2500000,
      balance: 2254330,
      description: "Pembayaran Sewa Bulanan",
    },
  ]

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.includes(searchTerm) ||
      tx.journalEntry.includes(searchTerm)
    const matchesAccount = accountFilter === "all" || tx.accountCode === accountFilter

    return matchesSearch && matchesAccount
  })

  const accounts = [
    { code: "1000", name: "Kas" },
    { code: "1100", name: "Piutang Usaha" },
    { code: "6000", name: "Beban Sewa" },
    { code: "6100", name: "Beban Perlengkapan Kantor" },
  ]

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
            Buku Besar
          </h2>
          <p className="text-muted-foreground">Lihat dan analisis semua transaksi yang diposting</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal rounded-full border-primary/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "PPP") : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-xl" />
            </PopoverContent>
          </Popover>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" className="rounded-full border-primary/20">
              <Download className="mr-2 h-4 w-4 text-primary" />
              Ekspor
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid gap-6 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-1 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Aset</CardTitle>
                <div className="text-2xl font-bold">Rp45.231.890</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-2 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Total Kewajiban</CardTitle>
                <div className="text-2xl font-bold">Rp12.234.590</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
            <div className="gradient-bg-4 p-1">
              <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                <CardTitle className="text-sm font-medium text-muted-foreground mb-2">Ekuitas</CardTitle>
                <div className="text-2xl font-bold">Rp32.997.300</div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari transaksi..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full md:w-[240px] rounded-full border-primary/20">
            <SelectValue placeholder="Pilih Akun" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Akun</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.code} value={account.code}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">Tanggal</TableHead>
                  <TableHead className="font-display">Entri Jurnal</TableHead>
                  <TableHead className="font-display">Akun</TableHead>
                  <TableHead className="font-display">Deskripsi</TableHead>
                  <TableHead className="text-right font-display">Debit</TableHead>
                  <TableHead className="text-right font-display">Kredit</TableHead>
                  <TableHead className="text-right font-display">Saldo</TableHead>
                  <TableHead className="text-right font-display">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="bg-white dark:bg-black rounded-b-xl">
            <Table>
              <TableBody>
                {filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    className="hover:bg-primary/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.journalEntry}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {tx.accountCode} - {tx.account}
                      </span>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="text-right">
                      {tx.debit > 0 ? `Rp${tx.debit.toLocaleString("id-ID")}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.credit > 0 ? `Rp${tx.credit.toLocaleString("id-ID")}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${tx.balance < 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      Rp{Math.abs(tx.balance).toLocaleString("id-ID")}
                      {tx.balance < 0 ? " KR" : " DB"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
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
