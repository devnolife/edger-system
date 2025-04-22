"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, FileText, Printer, Share2, Eye } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

export default function Laporan() {
  const [date, setDate] = useState<Date>()
  const [reportType, setReportType] = useState("neraca")

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

  const chartData = [
    {
      name: "Jan",
      pengeluaran: 2400000,
      anggaran: 3000000,
    },
    {
      name: "Feb",
      pengeluaran: 1398000,
      anggaran: 3000000,
    },
    {
      name: "Mar",
      pengeluaran: 1800000,
      anggaran: 3000000,
    },
    {
      name: "Apr",
      pengeluaran: 1908000,
      anggaran: 3000000,
    },
    {
      name: "Mei",
      pengeluaran: 1800000,
      anggaran: 3000000,
    },
    {
      name: "Jun",
      pengeluaran: 1800000,
      anggaran: 3000000,
    },
  ]

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Laporan Keuangan
          </h2>
          <p className="text-muted-foreground">Lihat dan analisis laporan keuangan perusahaan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal rounded-full border-primary/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "PPP") : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-xl" />
            </PopoverContent>
          </Popover>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px] rounded-full border-primary/20">
              <SelectValue placeholder="Jenis Laporan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="neraca">Neraca</SelectItem>
              <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              <SelectItem value="arus-kas">Arus Kas</SelectItem>
              <SelectItem value="anggaran">Anggaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" className="rounded-full border-primary/20">
          <Printer className="mr-2 h-4 w-4 text-primary" />
          Cetak
        </Button>
        <Button variant="outline" className="rounded-full border-primary/20">
          <Download className="mr-2 h-4 w-4 text-primary" />
          Unduh PDF
        </Button>
        <Button variant="outline" className="rounded-full border-primary/20">
          <Share2 className="mr-2 h-4 w-4 text-primary" />
          Bagikan
        </Button>
      </motion.div>

      <Tabs defaultValue="neraca" value={reportType} onValueChange={setReportType} className="space-y-6">
        <motion.div variants={item}>
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex md:grid-cols-none rounded-full p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="neraca"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Neraca
            </TabsTrigger>
            <TabsTrigger
              value="pengeluaran"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Pengeluaran
            </TabsTrigger>
            <TabsTrigger
              value="arus-kas"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Arus Kas
            </TabsTrigger>
            <TabsTrigger
              value="anggaran"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Anggaran
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="neraca" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Neraca</CardTitle>
                <CardDescription>Per {date ? format(date, "dd MMMM yyyy") : "30 Juni 2023"}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Aset</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Kas dan Setara Kas</span>
                        <span className="font-medium">Rp45.231.890</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Piutang Usaha</span>
                        <span className="font-medium">Rp15.750.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Persediaan</span>
                        <span className="font-medium">Rp28.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Peralatan Kantor</span>
                        <span className="font-medium">Rp12.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total Aset</span>
                        <span>Rp101.481.890</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Kewajiban</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Hutang Usaha</span>
                        <span className="font-medium">Rp8.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Hutang Pajak</span>
                        <span className="font-medium">Rp3.734.590</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total Kewajiban</span>
                        <span>Rp12.234.590</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ekuitas</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Modal Saham</span>
                        <span className="font-medium">Rp50.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Laba Ditahan</span>
                        <span className="font-medium">Rp39.247.300</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total Ekuitas</span>
                        <span>Rp89.247.300</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2">
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total Kewajiban dan Ekuitas</span>
                      <span>Rp101.481.890</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="pengeluaran" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Laporan Pengeluaran</CardTitle>
                <CardDescription>Periode {date ? format(date, "MMMM yyyy") : "Juni 2023"}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Beban</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Harga Pokok Penjualan</span>
                        <span className="font-medium">Rp45.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Beban Sewa</span>
                        <span className="font-medium">Rp12.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Beban Gaji</span>
                        <span className="font-medium">Rp8.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Beban Utilitas</span>
                        <span className="font-medium">Rp1.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Beban Penyusutan</span>
                        <span className="font-medium">Rp2.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total Beban</span>
                        <span>Rp69.000.000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Grafik Pengeluaran</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                              fontFamily: "var(--font-poppins)",
                            }}
                            formatter={(value) => [`Rp${value.toLocaleString("id-ID")}`, ""]}
                          />
                          <Legend />
                          <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#3674B5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="anggaran" name="Anggaran" fill="#578FCA" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="arus-kas" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Laporan Arus Kas</CardTitle>
                <CardDescription>Periode {date ? format(date, "MMMM yyyy") : "Juni 2023"}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Arus Kas dari Aktivitas Operasi</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Dana Anggaran</span>
                        <span className="font-medium">Rp68.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pembayaran kepada Pemasok</span>
                        <span className="font-medium text-red-500">-Rp42.300.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pembayaran Gaji</span>
                        <span className="font-medium text-red-500">-Rp8.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pembayaran Beban Operasional</span>
                        <span className="font-medium text-red-500">-Rp13.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Kas Bersih dari Aktivitas Operasi</span>
                        <span>Rp4.200.000</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Arus Kas dari Aktivitas Investasi</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Pembelian Aset Tetap</span>
                        <span className="font-medium text-red-500">-Rp2.500.000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Kas Bersih dari Aktivitas Investasi</span>
                        <span className="text-red-500">-Rp2.500.000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2">
                    <div className="flex justify-between py-2 font-bold">
                      <span>Kenaikan (Penurunan) Bersih Kas</span>
                      <span>Rp1.700.000</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Kas dan Setara Kas Awal Periode</span>
                      <span className="font-medium">Rp43.531.890</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Kas dan Setara Kas Akhir Periode</span>
                      <span>Rp45.231.890</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="anggaran" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Laporan Anggaran</CardTitle>
                <CardDescription>Periode {date ? format(date, "MMMM yyyy") : "Juni 2023"}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Anggaran vs Realisasi</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Total Anggaran</span>
                        <span className="font-medium">Rp75.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Total Pengeluaran</span>
                        <span className="font-medium">Rp69.000.000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Sisa Anggaran</span>
                        <span className="text-[#3674B5]">Rp6.000.000</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detail Anggaran per Kategori</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Operasional</span>
                        <div className="text-right">
                          <div className="flex justify-end gap-4">
                            <span>Anggaran: Rp30.000.000</span>
                            <span>Realisasi: Rp28.500.000</span>
                          </div>
                          <div className="text-xs text-[#3674B5] mt-1">Sisa: Rp1.500.000 (5%)</div>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Gaji dan Tunjangan</span>
                        <div className="text-right">
                          <div className="flex justify-end gap-4">
                            <span>Anggaran: Rp25.000.000</span>
                            <span>Realisasi: Rp25.000.000</span>
                          </div>
                          <div className="text-xs text-[#A1E3F9] mt-1">Sisa: Rp0 (0%)</div>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pengadaan</span>
                        <div className="text-right">
                          <div className="flex justify-end gap-4">
                            <span>Anggaran: Rp15.000.000</span>
                            <span>Realisasi: Rp12.500.000</span>
                          </div>
                          <div className="text-xs text-[#3674B5] mt-1">Sisa: Rp2.500.000 (16.7%)</div>
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pelatihan</span>
                        <div className="text-right">
                          <div className="flex justify-end gap-4">
                            <span>Anggaran: Rp5.000.000</span>
                            <span>Realisasi: Rp3.000.000</span>
                          </div>
                          <div className="text-xs text-[#3674B5] mt-1">Sisa: Rp2.000.000 (40%)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Grafik Anggaran vs Realisasi</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                              fontFamily: "var(--font-poppins)",
                            }}
                            formatter={(value) => [`Rp${value.toLocaleString("id-ID")}`, ""]}
                          />
                          <Legend />
                          <Bar dataKey="pengeluaran" name="Realisasi" fill="#3674B5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="anggaran" name="Anggaran" fill="#578FCA" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div variants={item}>
        <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
            <CardTitle className="font-display text-xl">Riwayat Laporan</CardTitle>
            <CardDescription>Laporan yang telah dibuat sebelumnya</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                {
                  id: "RPT-2023-0012",
                  name: "Laporan Keuangan Q2 2023",
                  type: "Lengkap",
                  date: "30/06/2023",
                  createdBy: "Admin Pengguna",
                },
                {
                  id: "RPT-2023-0011",
                  name: "Laporan Pengeluaran Mei 2023",
                  type: "Pengeluaran",
                  date: "31/05/2023",
                  createdBy: "Admin Pengguna",
                },
                {
                  id: "RPT-2023-0010",
                  name: "Neraca April 2023",
                  type: "Neraca",
                  date: "30/04/2023",
                  createdBy: "Admin Pengguna",
                },
                {
                  id: "RPT-2023-0009",
                  name: "Laporan Keuangan Q1 2023",
                  type: "Lengkap",
                  date: "31/03/2023",
                  createdBy: "Admin Pengguna",
                },
              ].map((report, index) => (
                <motion.div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black/40 hover:bg-primary/5 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.id} • {report.type} • {report.date} • {report.createdBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Download className="h-4 w-4 mr-2" />
                      Unduh
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
