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

export default function ChartOfAccounts() {
  const { role } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [accountType, setAccountType] = useState("all")

  const accounts = [
    {
      id: "1000",
      name: "Cash",
      type: "Asset",
      subtype: "Current Asset",
      balance: 45231.89,
      active: true,
    },
    {
      id: "1100",
      name: "Accounts Receivable",
      type: "Asset",
      subtype: "Current Asset",
      balance: 15750.0,
      active: true,
    },
    {
      id: "1200",
      name: "Inventory",
      type: "Asset",
      subtype: "Current Asset",
      balance: 28500.0,
      active: true,
    },
    {
      id: "1500",
      name: "Office Equipment",
      type: "Asset",
      subtype: "Fixed Asset",
      balance: 12000.0,
      active: true,
    },
    {
      id: "2000",
      name: "Accounts Payable",
      type: "Liability",
      subtype: "Current Liability",
      balance: 8500.0,
      active: true,
    },
    {
      id: "3000",
      name: "Common Stock",
      type: "Equity",
      subtype: "Owner's Equity",
      balance: 50000.0,
      active: true,
    },
    {
      id: "4000",
      name: "Sales Revenue",
      type: "Revenue",
      subtype: "Operating Revenue",
      balance: 75000.0,
      active: true,
    },
    {
      id: "5000",
      name: "Cost of Goods Sold",
      type: "Expense",
      subtype: "Cost of Sales",
      balance: 45000.0,
      active: true,
    },
    {
      id: "6000",
      name: "Rent Expense",
      type: "Expense",
      subtype: "Operating Expense",
      balance: 12000.0,
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
            Chart of Accounts
          </h2>
          <p className="text-muted-foreground">Manage your financial accounts structure</p>
        </div>
        {canEdit && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="rounded-full animated-gradient-button text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search accounts..."
            className="pl-10 rounded-full border-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={accountType} onValueChange={setAccountType}>
          <SelectTrigger className="w-full md:w-[180px] rounded-full border-primary/20">
            <SelectValue placeholder="Account Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Asset</SelectItem>
            <SelectItem value="liability">Liability</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">Account Code</TableHead>
                  <TableHead className="font-display">Account Name</TableHead>
                  <TableHead className="font-display">Type</TableHead>
                  <TableHead className="font-display">Subtype</TableHead>
                  <TableHead className="text-right font-display">Balance</TableHead>
                  <TableHead className="font-display">Status</TableHead>
                  {canEdit && <TableHead className="text-right font-display">Actions</TableHead>}
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
                    <TableCell className="text-right font-medium">${account.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${account.active ? "text-green-600" : "text-red-600"}`}>
                        <div className={`h-2 w-2 rounded-full ${account.active ? "bg-green-600" : "bg-red-600"}`} />
                        {account.active ? "Active" : "Inactive"}
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
