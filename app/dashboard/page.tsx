"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentJournalEntries } from "@/components/recent-journal-entries"
import { PendingApprovals } from "@/components/pending-approvals"
import { FinancialSummary } from "@/components/financial-summary"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { ArrowUp, Wallet, Activity } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getDashboardSummary } from "@/app/actions/dashboard-actions"
import { formatRupiah } from "@/lib/format-rupiah"

export default function Dashboard() {
  const { role } = useUserRole()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    totalExpenses: 0,
    expenseGrowth: 0,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getDashboardSummary()
        if (result.success && result.data) {
          setDashboardData(result.data)
        } else {
          setError(result.error || "Failed to fetch dashboard data")
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight">SiKePro UNISMUH</h2>
          <p className="text-muted-foreground">
            Selamat datang di Sistem Keuangan Proyek Universitas Muhammadiyah Makassar
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <LoadingSpinner size="lg" text="Memuat data dashboard..." />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </div>
      ) : (
        <>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div variants={item}>
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex md:grid-cols-none rounded-full p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger
                  value="overview"
                  className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Ringkasan
                </TabsTrigger>
                {role === "superadmin" && (
                  <TabsTrigger
                    value="system"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Status Sistem
                  </TabsTrigger>
                )}
                {(role === "superadmin" || role === "admin") && (
                  <TabsTrigger
                    value="team"
                    className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Aktivitas Tim
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="tasks"
                  className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Tugas Saya
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="overview" className="space-y-6">
              <motion.div className="grid gap-6 md:grid-cols-2" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                    <div className="gradient-bg-1 p-1">
                      <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Aset</p>
                            <h3 className="text-2xl font-bold mt-1">{formatRupiah(dashboardData.totalAssets)}</h3>
                            <p className="text-xs flex items-center mt-1 text-green-500 font-medium">
                              <ArrowUp className="h-3 w-3 mr-1" />
                              Anggaran Aktif
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-[#3674B5]/10 flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-[#3674B5]" />
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
                            <p className="text-sm font-medium text-muted-foreground">Pengeluaran</p>
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
                            <Activity className="h-6 w-6 text-[#A1E3F9]" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="lg:col-span-4">
                  <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                      <CardTitle className="font-display text-xl">Ringkasan Keuangan</CardTitle>
                      <CardDescription>Ikhtisar bulanan metrik keuangan utama</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <FinancialSummary />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-3">
                  <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                      <CardTitle className="font-display text-xl">Entri Jurnal Terbaru</CardTitle>
                      <CardDescription>Transaksi keuangan terbaru</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <RecentJournalEntries />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {(role === "superadmin" || role === "admin") && (
                <motion.div variants={item}>
                  <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                      <CardTitle className="font-display text-xl">Menunggu Persetujuan</CardTitle>
                      <CardDescription>Entri jurnal yang menunggu persetujuan Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <PendingApprovals />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* Konten tab lainnya tetap sama */}
          </Tabs>
        </>
      )}
    </motion.div>
  )
}
