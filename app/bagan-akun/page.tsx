"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, Edit, Plus, Search, Trash } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export default function BaganAkun() {
  const { role } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [accountType, setAccountType] = useState("all")

  const accounts = [
    {
      id: "1000",
      name: "Kas",
      type: "Aset",
      subtype: "Aset Lancar",
      balance: 45231890,
      active: true,
    },
    {
      id: "1100",
      name: "Piutang Usaha",
      type: "Aset",
      subtype: "Aset Lancar",
      balance: 15750000,
      active: true,
    },
    {
      id: "1200",
      name: "Persediaan",
      type: "Aset",
      subtype: "Aset Lancar",
      balance: 28500000,
      active: true,
    },
    {
      id: "1500",
      name: "Peralatan Kantor",
      type: "Aset",
      subtype: "Aset Tetap",
      balance: 12000000,
      active: true,
    },
    {
      id: "2000",
      name: "Hutang Usaha",
      type: "Kewajiban",
      subtype: "Kewajiban Lancar",
      balance: 8500000,
      active: true,
    },
    {
      id: "3000",
      name: "Modal Saham",
      type: "Ekuitas",
      subtype: "Modal Pemilik",
      balance: 50000000,
      active: true,
    },
    {
      id: "4000",
      name: "Pendapatan Penjualan",
      type: "Pendapatan",
      subtype: "Pendapatan Operasional",
      balance: 75000000,
      active: true,
    },
    {
      id: "5000",
      name: "Harga Pokok Penjualan",
      type: "Beban",
      subtype: "Beban Penjualan",
      balance: 45000000,
      active: true,
    },
    {
      id: "6000",
      name: "Beban Sewa",
      type: "Beban",
      subtype: "Beban Operasional",
      balance: 12000000,
      active: true,
    },
  ]

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) || account.id.includes(searchTerm)
    const matchesType = accountType === "all" || account.type.toLowerCase() === accountType.toLowerCase()

    return matchesSearch && matchesType
  })

  const canEdit = role === "superadmin" || role === "admin"

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
            Bagan Akun
          </h2>
          <p className="text-muted-foreground">Kelola struktur akun keuangan Anda</p>
        </div>
        {canEdit && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="rounded-full animated-gradient-button text-white">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Akun
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari akun..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={accountType} onValueChange={setAccountType}>
          <SelectTrigger className="w-full md:w-[180px] rounded-full border-primary/20">
            <SelectValue placeholder="Tipe Akun" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="aset">Aset</SelectItem>
            <SelectItem value="kewajiban">Kewajiban</SelectItem>
            <SelectItem value="ekuitas">Ekuitas</SelectItem>
            <SelectItem value="pendapatan">Pendapatan</SelectItem>
            <SelectItem value="beban">Beban</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">Kode Akun</TableHead>
                  <TableHead className="font-display">Nama Akun</TableHead>
                  <TableHead className="font-display">Tipe</TableHead>
                  <TableHead className="font-display">Subtipe</TableHead>
                  <TableHead className="text-right font-display">Saldo</TableHead>
                  <TableHead className="font-display">Status</TableHead>
                  {canEdit && <TableHead className="text-right font-display">Tindakan</TableHead>}
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          <div className="bg-white dark:bg-black rounded-b-xl">
            <Table>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <motion.tr
                    key={account.id}
                    className="hover:bg-primary/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <TableCell className="font-medium">{account.id}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{account.type}</span>
                    </TableCell>
                    <TableCell>{account.subtype}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp{account.balance.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${account.active ? "text-green-600" : "text-red-600"}`}>
                        <div className={`h-2 w-2 rounded-full ${account.active ? "bg-green-600" : "bg-red-600"}`} />
                        {account.active ? "Aktif" : "Tidak Aktif"}
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {role === "superadmin" && (
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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
