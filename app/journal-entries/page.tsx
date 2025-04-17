"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Check, Eye, Plus, Search, X } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export default function JournalEntries() {
  const { role } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const entries = [
    {
      id: "JE-2023-0048",
      date: "2023-06-15",
      description: "Software Subscription Renewal",
      amount: 899.99,
      status: "pending",
      createdBy: "Mike Johnson",
    },
    {
      id: "JE-2023-0047",
      date: "2023-06-16",
      description: "Travel Reimbursement - Sales Team",
      amount: 1250.75,
      status: "pending",
      createdBy: "Jane Smith",
    },
    {
      id: "JE-2023-0046",
      date: "2023-06-16",
      description: "Marketing Expenses - Q2 Campaign",
      amount: 3500.0,
      status: "pending",
      createdBy: "John Doe",
    },
    {
      id: "JE-2023-0045",
      date: "2023-06-15",
      description: "Office Supplies Purchase",
      amount: 245.67,
      status: "posted",
      createdBy: "Sarah Williams",
    },
    {
      id: "JE-2023-0044",
      date: "2023-06-14",
      description: "Client Payment - ABC Corp",
      amount: 5000.0,
      status: "posted",
      createdBy: "Robert Brown",
    },
    {
      id: "JE-2023-0043",
      date: "2023-06-14",
      description: "Monthly Rent Payment",
      amount: 2500.0,
      status: "posted",
      createdBy: "Jane Smith",
    },
    {
      id: "JE-2023-0042",
      date: "2023-06-13",
      description: "Utility Bills",
      amount: 350.25,
      status: "posted",
      createdBy: "Mike Johnson",
    },
  ]

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || entry.id.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const canApprove = role === "superadmin" || role === "admin"

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
            Journal Entries
          </h2>
          <p className="text-muted-foreground">Manage and track all financial transactions</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="rounded-full animated-gradient-button text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search entries..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-display">Entry ID</TableHead>
                  <TableHead className="font-display">Date</TableHead>
                  <TableHead className="font-display">Description</TableHead>
                  <TableHead className="font-display">Created By</TableHead>
                  <TableHead className="text-right font-display">Amount</TableHead>
                  <TableHead className="font-display">Status</TableHead>
                  <TableHead className="text-right font-display">Actions</TableHead>
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
                    <TableCell className="text-right font-medium">${entry.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className="rounded-full"
                        variant={
                          entry.status === "posted"
                            ? "outline"
                            : entry.status === "pending"
                              ? "secondary"
                              : entry.status === "rejected"
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
                        {canApprove && entry.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="text-red-500 rounded-full h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-green-600 rounded-full h-8 w-8">
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
