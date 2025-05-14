"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Lock, Search, Shield, Trash, UserPlus } from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { getAllUsers } from "@/app/actions/user-actions"

// Define the user type
type User = {
  id: string
  name: string
  email: string
  role: string
  department: string
  lastActive: string
  status: string
}

export default function Pengguna() {
  const { role } = useUserRole()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const result = await getAllUsers()

        if (result.success) {
          setUsers(result.users)
        } else {
          setError(result.error || "Failed to fetch users")
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("An error occurred while fetching user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm)
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Update the role comparison to fix the linter error
  // The role from useUserRole is "SUPERVISOR" or "OPERATOR" 
  // We need to match against these values
  const canManageUsers = role === "SUPERVISOR"

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
            Manajemen Pengguna
          </h2>
          <p className="text-muted-foreground">Kelola pengguna dan hak akses sistem</p>
        </div>
        {canManageUsers && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="rounded-full animated-gradient-button text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </motion.div>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading user data...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div variants={item}>
              <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                <div className="gradient-bg-1 p-1">
                  <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Pengguna</p>
                        <h3 className="text-2xl font-bold mt-1">{users.length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                <div className="gradient-bg-2 p-1">
                  <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pengguna Aktif</p>
                        <h3 className="text-2xl font-bold mt-1">{users.filter((u) => u.status === "active").length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                <div className="gradient-bg-4 p-1">
                  <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Admin</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {users.filter((u) => u.role === "SUPERVISOR").length}
                        </h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-pink-500" />
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={item} className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari pengguna..."
                className="pl-10 rounded-full border-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px] rounded-full border-primary/20">
                <SelectValue placeholder="Peran" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <div className="rounded-t-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-2">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-display">Pengguna</TableHead>
                      <TableHead className="font-display">ID</TableHead>
                      <TableHead className="font-display">Peran</TableHead>
                      <TableHead className="font-display">Departemen</TableHead>
                      <TableHead className="font-display">Terakhir Aktif</TableHead>
                      <TableHead className="font-display">Status</TableHead>
                      {canManageUsers && <TableHead className="text-right font-display">Tindakan</TableHead>}
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div className="bg-white dark:bg-black rounded-b-xl">
                <Table>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManageUsers ? 7 : 6} className="h-24 text-center">
                          Tidak ada data pengguna ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          className="hover:bg-primary/5 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-primary">
                                <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
                                <AvatarFallback className="bg-primary text-white">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>
                            <Badge
                              className="rounded-full"
                              variant={
                                user.role === "SUPERVISOR" ? "default" : "outline"
                              }
                            >
                              {user.role === "SUPERVISOR" ? "Supervisor" : "Operator"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{user.lastActive}</TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-2 ${user.status === "active" ? "text-green-600" : "text-red-600"}`}
                            >
                              <div
                                className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-green-600" : "bg-red-600"}`}
                              />
                              {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                            </div>
                          </TableCell>
                          {canManageUsers && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
