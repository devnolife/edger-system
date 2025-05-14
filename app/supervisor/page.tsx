"use client"

import { useEffect, useState, useCallback } from "react"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import { formatRupiah } from "@/lib/format-rupiah"
import { requireSupervisor, logout } from "@/app/actions/auth-actions"
import { getSupervisorData, Activity, SupervisorSummary } from "@/app/actions/supervisor-actions"
import { motion } from "framer-motion"
import { FinancialSummary } from "@/components/financial-summary"
import { RecentJournalEntries } from "@/components/recent-journal-entries"
import { Eye, ArrowUp, Activity as ActivityIcon, FileText, FilePlus, Heart, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function SupervisorPage() {
  const { user, role } = useUserRole()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [dashboardData, setDashboardData] = useState<SupervisorSummary>({
    totalExpenses: 0,
    expenseGrowth: 0,
    totalBudgetItems: 0,
    totalAdditionalBudgetItems: 0,
    activeOperatorsCount: 0,
    totalActivities: 0,
    lastUpdateTime: new Date().toISOString()
  })
  const [error, setError] = useState<string | null>(null)

  // Auth check effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireSupervisor()
      } catch (error) {
        router.push("/dashboard")
        return
      }
    }

    checkAuth()
  }, [router])

  // Data fetching function
  const fetchData = useCallback(async (showRefreshingState = true) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const result = await getSupervisorData()

      if (result.success) {
        if (result.summary) {
          setDashboardData(result.summary)
        }

        if (result.activities) {
          setActivities(result.activities)
        }

        setError(null)
      } else {
        setError(result.error || "Gagal memuat data")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Manual refresh handler
  const handleRefresh = async () => {
    try {
      await fetchData(true)
      toast({
        title: "Data diperbarui",
        description: `Data terakhir diperbarui: ${new Date().toLocaleTimeString()}`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Gagal memperbarui data",
        description: "Silakan coba lagi nanti",
        variant: "destructive"
      })
    }
  }

  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === "all") return true
    if (activeTab === "expenses") return activity.type === "expense"
    if (activeTab === "budgets") return activity.type === "budget"
    if (activeTab === "allocations") return activity.type === "additionalAllocation"
    return true
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  // Format the last update time
  const formattedLastUpdate = dashboardData.lastUpdateTime
    ? new Date(dashboardData.lastUpdateTime).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : "Belum diperbarui"

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa] dark:bg-[#121212] flex flex-col">
      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-5 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-01-19%20at%2013.24.54_45730a90.jpg-KXRV29YV1DoIphMNMmlr81ICmfO9jW.jpeg)",
          backgroundSize: "cover",
          filter: "blur(2px)",
        }}
      />

      {/* Dekorasi blob */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Custom Header for Supervisor */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/50 px-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-display text-gradient-primary text-xl font-bold">
              <span>Sistem Keuangan Proyek UNISMUH Makassar</span>
            </Link>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                Kembali ke Dashboard
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await logout()
                router.push("/")
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8">
        <motion.div className="space-y-8 max-w-7xl mx-auto" initial="hidden" animate="show" variants={container}>
          <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Dashboard Supervisor
              </h2>
              <p className="text-muted-foreground">
                Pantau dan verifikasi semua kegiatan sistem
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-4 flex items-center gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Memperbarui..." : "Refresh Data"}</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                Diperbarui: {formattedLastUpdate}
              </p>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <LoadingSpinner size="lg" text="Memuat data supervisor..." />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-red-500 mb-2">Error: {error}</p>
                <Button onClick={handleRefresh}>Coba Lagi</Button>
              </div>
            </div>
          ) : (
            <>
              <motion.div className="grid gap-6 md:grid-cols-4" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                    <div className="gradient-bg-4 p-1">
                      <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                            <h3 className="text-2xl font-bold mt-1">{formatRupiah(dashboardData.totalExpenses)}</h3>
                            <p
                              className={`text-xs flex items-center mt-1 ${dashboardData.expenseGrowth >= 0 ? "text-green-500" : "text-red-500"} font-medium`}
                            >
                              <ArrowUp
                                className={`h-3 w-3 mr-1 ${dashboardData.expenseGrowth < 0 ? "transform rotate-180" : ""}`}
                              />
                              {dashboardData.expenseGrowth.toFixed(1)}% dari bulan lalu
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-[#A1E3F9]/10 flex items-center justify-center">
                            <ActivityIcon className="h-6 w-6 text-[#A1E3F9]" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                    <div className="gradient-bg-1 p-1">
                      <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Anggaran</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardData.totalBudgetItems}</h3>
                            <p className="text-xs flex items-center mt-1 text-blue-500 font-medium">Item anggaran aktif</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-[#3674B5]/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-[#3674B5]" />
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
                            <p className="text-sm font-medium text-muted-foreground">Alokasi Tambahan</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardData.totalAdditionalBudgetItems}</h3>
                            <p className="text-xs flex items-center mt-1 text-purple-500 font-medium">
                              Item alokasi tambahan
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <FilePlus className="h-6 w-6 text-purple-500" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                    <div className="gradient-bg-3 p-1">
                      <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Aktivitas</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardData.totalActivities}</h3>
                            <p className="text-xs flex items-center mt-1 text-green-500 font-medium">
                              Operator aktif: {dashboardData.activeOperatorsCount}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ActivityIcon className="h-6 w-6 text-green-500" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="lg:col-span-4">
                  <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                      <CardTitle className="font-display text-xl">Ringkasan Keuangan</CardTitle>
                      <CardDescription>Ikhtisar bulanan metrik keuangan utama</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <FinancialSummary />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-3">
                  <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                      <CardTitle className="font-display text-xl">Transaksi Terbaru</CardTitle>
                      <CardDescription>Aktivitas keuangan terbaru</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <RecentJournalEntries />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div variants={item}>
                <Card className="rounded-2xl border-none shadow-lg overflow-hidden mt-8">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                    <CardTitle className="font-display text-xl">Aktivitas Operator</CardTitle>
                    <CardDescription>Riwayat aktivitas operator dalam sistem</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-6 rounded-xl">
                        <TabsTrigger value="all" className="rounded-lg">Semua</TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-lg">Pengeluaran</TabsTrigger>
                        <TabsTrigger value="budgets" className="rounded-lg">Anggaran</TabsTrigger>
                        <TabsTrigger value="allocations" className="rounded-lg">Alokasi Tambahan</TabsTrigger>
                      </TabsList>

                      <TabsContent value={activeTab} className="mt-0">
                        <div className="rounded-xl overflow-hidden border border-border/40">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="font-display">Tanggal</TableHead>
                                <TableHead className="font-display">Operator</TableHead>
                                <TableHead className="font-display">Deskripsi</TableHead>
                                <TableHead className="font-display">Jumlah</TableHead>
                                <TableHead className="font-display">Status</TableHead>
                                <TableHead className="font-display text-right">Detail</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredActivities.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8">
                                    <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredActivities.map((activity, index) => (
                                  <motion.tr
                                    key={activity.id}
                                    className="hover:bg-primary/5 transition-colors"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <TableCell>{formatDate(activity.date)}</TableCell>
                                    <TableCell>{activity.operator}</TableCell>
                                    <TableCell>{activity.description}</TableCell>
                                    <TableCell>{activity.amount ? formatRupiah(activity.amount) : "-"}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={activity.type === "expense" ? "outline" : "default"}
                                        className={`rounded-full ${activity.type === "expense"
                                          ? activity.status.includes("Tambahan")
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                          : activity.type === "additionalAllocation"
                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                                            : ""
                                          }`}
                                      >
                                        {activity.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-8 w-8"
                                        asChild
                                      >
                                        <a
                                          href={
                                            activity.type === "expense"
                                              ? `/pengeluaran?expense=${activity.id}`
                                              : activity.type === "budget"
                                                ? `/anggaran?budgetId=${activity.id}`
                                                : `/anggaran-tambahan?allocationId=${activity.id}`
                                          }
                                        >
                                          <Eye className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </TableCell>
                                  </motion.tr>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          <LoadingOverlay isLoading={isLoading} />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/50 py-6 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} - Sistem Keuangan Proyek UNISMUH Makassar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-500" /> Mode Supervisor
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
