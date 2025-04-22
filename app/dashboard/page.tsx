"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentJournalEntries } from "@/components/recent-journal-entries"
import { PendingApprovals } from "@/components/pending-approvals"
import { FinancialSummary } from "@/components/financial-summary"
import { UserActivitySummary } from "@/components/user-activity-summary"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { ArrowUp, Wallet, CreditCard, Activity } from "lucide-react"

export default function Dashboard() {
  const { role } = useUserRole()
  const [activeTab, setActiveTab] = useState("overview")

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
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground">Selamat datang kembali! Berikut ringkasan sistem keuangan Anda.</p>
        </div>
      </motion.div>

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
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <Card className="overflow-hidden rounded-2xl border-none shadow-lg card-hover-effect">
                <div className="gradient-bg-1 p-1">
                  <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Aset</p>
                        <h3 className="text-2xl font-bold mt-1">Rp45.231.890</h3>
                        <p className="text-xs flex items-center mt-1 text-green-500 font-medium">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          +20,1% dari bulan lalu
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
                <div className="gradient-bg-2 p-1">
                  <CardContent className="bg-white dark:bg-black rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Kewajiban</p>
                        <h3 className="text-2xl font-bold mt-1">Rp12.234.590</h3>
                        <p className="text-xs flex items-center mt-1 text-green-500 font-medium">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          +4,3% dari bulan lalu
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-[#578FCA]/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-[#578FCA]" />
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
                        <h3 className="text-2xl font-bold mt-1">Rp9.876.540</h3>
                        <p className="text-xs flex items-center mt-1 text-green-500 font-medium">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          +7,2% dari bulan lalu
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

        {role === "superadmin" && (
          <TabsContent value="system" className="space-y-6">
            <motion.div variants={item}>
              <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                  <CardTitle className="font-display text-xl">Status Sistem</CardTitle>
                  <CardDescription>Kinerja dan status sistem secara keseluruhan</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 bg-white dark:bg-black/40 p-4 rounded-xl">
                        <p className="text-sm font-medium">Status Database</p>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-[#3674B5] mr-2 pulse"></div>
                          <p className="text-sm font-medium">Sehat</p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-white dark:bg-black/40 p-4 rounded-xl">
                        <p className="text-sm font-medium">Status API</p>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-[#3674B5] mr-2 pulse"></div>
                          <p className="text-sm font-medium">Operasional</p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-white dark:bg-black/40 p-4 rounded-xl">
                        <p className="text-sm font-medium">Penyimpanan</p>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-[#A1E3F9] mr-2"></div>
                          <p className="text-sm font-medium">78% Terpakai</p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-white dark:bg-black/40 p-4 rounded-xl">
                        <p className="text-sm font-medium">Status Backup</p>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-[#3674B5] mr-2 pulse"></div>
                          <p className="text-sm font-medium">Backup terakhir: 2 jam lalu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {(role === "superadmin" || role === "admin") && (
          <TabsContent value="team" className="space-y-6">
            <motion.div variants={item}>
              <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                  <CardTitle className="font-display text-xl">Aktivitas Tim</CardTitle>
                  <CardDescription>Tindakan terbaru oleh anggota tim</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UserActivitySummary />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        <TabsContent value="tasks" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden card-hover-effect">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Tugas Saya</CardTitle>
                <CardDescription>Tugas dan tindakan yang tertunda</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <motion.div
                    className="rounded-xl border border-primary/20 bg-white dark:bg-black/40 p-4 hover:shadow-md transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Tinjau Laporan Keuangan Q2</div>
                      <div className="text-sm text-primary font-semibold">Jatuh tempo dalam 2 hari</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Tinjau dan setujui laporan keuangan triwulanan sebelum rapat dewan.
                    </div>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-primary/20 bg-white dark:bg-black/40 p-4 hover:shadow-md transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Setujui Entri Jurnal</div>
                      <div className="text-sm text-destructive font-semibold">Jatuh tempo hari ini</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">5 entri jurnal menunggu persetujuan Anda.</div>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-primary/20 bg-white dark:bg-black/40 p-4 hover:shadow-md transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Perbarui Bagan Akun</div>
                      <div className="text-sm text-secondary font-semibold">Jatuh tempo dalam 5 hari</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Tambahkan akun pengeluaran baru untuk departemen pemasaran.
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
