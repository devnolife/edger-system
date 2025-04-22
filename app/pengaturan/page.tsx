"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Check, Database, Globe, Lock, Save, Server, Shield } from "lucide-react"

export default function Pengaturan() {
  const [activeTab, setActiveTab] = useState("umum")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
            Pengaturan Sistem
          </h2>
          <p className="text-muted-foreground">Konfigurasi dan preferensi sistem keuangan</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="rounded-full animated-gradient-button text-white" onClick={handleSave}>
            {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? "Tersimpan" : "Simpan Perubahan"}
          </Button>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="umum" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <motion.div variants={item}>
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex md:grid-cols-none rounded-full p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="umum"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Umum
            </TabsTrigger>
            <TabsTrigger
              value="keamanan"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Keamanan
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Database
            </TabsTrigger>
            <TabsTrigger
              value="sistem"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Sistem
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="umum" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Informasi Perusahaan</CardTitle>
                <CardDescription>Detail dasar tentang perusahaan Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nama Institusi</Label>
                    <Input id="company-name" defaultValue="Universitas Muhammadiyah Makassar" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">NPWP</Label>
                    <Input id="tax-id" defaultValue="02.345.678.9-234.000" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="info@unismuh.ac.id" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input id="phone" defaultValue="+62 411 866972" className="rounded-lg" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      defaultValue="Jl. Sultan Alauddin No.259, Gn. Sari, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90221"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <CardTitle className="font-display text-xl">Preferensi Sistem</CardTitle>
                <CardDescription>Pengaturan tampilan dan bahasa</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Bahasa</Label>
                    <Select defaultValue="id">
                      <SelectTrigger id="language" className="rounded-lg">
                        <SelectValue placeholder="Pilih bahasa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Waktu</Label>
                    <Select defaultValue="asia-jakarta">
                      <SelectTrigger id="timezone" className="rounded-lg">
                        <SelectValue placeholder="Pilih zona waktu" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="asia-jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                        <SelectItem value="asia-makassar">Asia/Makassar (GMT+8)</SelectItem>
                        <SelectItem value="asia-jayapura">Asia/Jayapura (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Format Tanggal</Label>
                    <Select defaultValue="dd-mm-yyyy">
                      <SelectTrigger id="date-format" className="rounded-lg">
                        <SelectValue placeholder="Pilih format tanggal" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Mata Uang</Label>
                    <Select defaultValue="idr">
                      <SelectTrigger id="currency" className="rounded-lg">
                        <SelectValue placeholder="Pilih mata uang" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="idr">Rupiah (IDR)</SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Mode Gelap Otomatis</Label>
                      <p className="text-sm text-muted-foreground">Mengikuti preferensi sistem</p>
                    </div>
                    <Switch id="dark-mode" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notifikasi Email</Label>
                      <p className="text-sm text-muted-foreground">Terima pemberitahuan via email</p>
                    </div>
                    <Switch id="notifications" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="keamanan" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-xl">Keamanan Akun</CardTitle>
                </div>
                <CardDescription>Pengaturan keamanan dan autentikasi</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autentikasi Dua Faktor</Label>
                      <p className="text-sm text-muted-foreground">Tingkatkan keamanan dengan verifikasi tambahan</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Batas Waktu Sesi</Label>
                      <p className="text-sm text-muted-foreground">Logout otomatis setelah tidak aktif</p>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Pilih durasi" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="15">15 menit</SelectItem>
                        <SelectItem value="30">30 menit</SelectItem>
                        <SelectItem value="60">1 jam</SelectItem>
                        <SelectItem value="120">2 jam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Kebijakan Kata Sandi</Label>
                      <p className="text-sm text-muted-foreground">Persyaratan kompleksitas kata sandi</p>
                    </div>
                    <Select defaultValue="strong">
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Pilih kebijakan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="basic">Dasar</SelectItem>
                        <SelectItem value="medium">Menengah</SelectItem>
                        <SelectItem value="strong">Kuat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Riwayat Login</Label>
                  <div className="space-y-3 rounded-xl border p-4">
                    {[
                      { device: "Chrome di Windows", ip: "182.23.45.67", time: "Hari ini, 10:23" },
                      { device: "Safari di iPhone", ip: "182.23.45.67", time: "Kemarin, 18:45" },
                      { device: "Firefox di MacOS", ip: "103.12.34.56", time: "21 Juni 2023, 09:12" },
                    ].map((login, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium">{login.device}</div>
                          <div className="text-xs text-muted-foreground">IP: {login.ip}</div>
                        </div>
                        <div className="text-muted-foreground">{login.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-xl">Izin dan Hak Akses</CardTitle>
                </div>
                <CardDescription>Konfigurasi izin untuk peran pengguna</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Admin</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Akses penuh ke semua modul</span>
                        <Switch defaultChecked disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mengelola pengguna</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Menyetujui entri jurnal</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Operator</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Membuat entri jurnal</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Melihat buku besar</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mengubah bagan akun</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Membuat laporan</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-xl">Konfigurasi Database</CardTitle>
                </div>
                <CardDescription>Pengaturan koneksi database</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="db-host">Host Database</Label>
                    <Input id="db-host" defaultValue="localhost" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-port">Port</Label>
                    <Input id="db-port" defaultValue="3306" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-name">Nama Database</Label>
                    <Input id="db-name" defaultValue="siskeu_db" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-user">Pengguna Database</Label>
                    <Input id="db-user" defaultValue="siskeu_user" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-password">Kata Sandi Database</Label>
                    <Input id="db-password" type="password" defaultValue="********" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-type">Jenis Database</Label>
                    <Select defaultValue="mysql">
                      <SelectTrigger id="db-type" className="rounded-lg">
                        <SelectValue placeholder="Pilih jenis database" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mariadb">MariaDB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup Otomatis</Label>
                      <p className="text-sm text-muted-foreground">Jadwalkan backup database secara otomatis</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Frekuensi Backup</Label>
                      <p className="text-sm text-muted-foreground">Seberapa sering backup dilakukan</p>
                    </div>
                    <Select defaultValue="daily">
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Pilih frekuensi" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="hourly">Setiap jam</SelectItem>
                        <SelectItem value="daily">Harian</SelectItem>
                        <SelectItem value="weekly">Mingguan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full">
                    Uji Koneksi
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    Backup Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="sistem" className="space-y-6">
          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-xl">Informasi Sistem</CardTitle>
                </div>
                <CardDescription>Detail tentang sistem dan lingkungan</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Versi Aplikasi</p>
                      <p className="font-medium">SisKeu v2.5.3</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tanggal Rilis</p>
                      <p className="font-medium">15 Juni 2023</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Server</p>
                      <p className="font-medium">Apache/2.4.52</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">PHP Version</p>
                      <p className="font-medium">8.1.12</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Database</p>
                      <p className="font-medium">MySQL 8.0.28</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Sistem Operasi</p>
                      <p className="font-medium">Ubuntu 22.04 LTS</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status Sistem</Label>
                  <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Database</span>
                      </div>
                      <span className="text-sm text-green-600">Operasional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">API</span>
                      </div>
                      <span className="text-sm text-green-600">Operasional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Layanan Backup</span>
                      </div>
                      <span className="text-sm text-green-600">Operasional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="font-medium">Penyimpanan</span>
                      </div>
                      <span className="text-sm text-yellow-600">78% Terpakai</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Log Sistem</Label>
                  <div className="h-40 overflow-auto rounded-xl bg-black/90 p-4 text-xs text-green-400 font-mono">
                    <div>[2023-06-22 08:15:23] INFO: Sistem dimulai</div>
                    <div>[2023-06-22 08:15:24] INFO: Koneksi database berhasil</div>
                    <div>[2023-06-22 08:15:25] INFO: Layanan cache dimulai</div>
                    <div>[2023-06-22 08:15:26] INFO: Layanan autentikasi dimulai</div>
                    <div>[2023-06-22 09:30:12] INFO: Backup otomatis berhasil</div>
                    <div>[2023-06-22 10:45:18] WARN: Penggunaan CPU tinggi terdeteksi</div>
                    <div>[2023-06-22 10:47:32] INFO: Penggunaan CPU kembali normal</div>
                    <div>[2023-06-22 12:00:00] INFO: Pemeliharaan terjadwal dimulai</div>
                    <div>[2023-06-22 12:05:23] INFO: Pemeliharaan terjadwal selesai</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-xl">Pemeliharaan</CardTitle>
                </div>
                <CardDescription>Pengaturan pemeliharaan sistem</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mode Pemeliharaan</Label>
                      <p className="text-sm text-muted-foreground">Nonaktifkan akses pengguna saat pemeliharaan</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pembersihan Log Otomatis</Label>
                      <p className="text-sm text-muted-foreground">Hapus log lama secara otomatis</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Retensi Log</Label>
                      <p className="text-sm text-muted-foreground">Berapa lama log disimpan</p>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="Pilih durasi" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="7">7 hari</SelectItem>
                        <SelectItem value="30">30 hari</SelectItem>
                        <SelectItem value="90">90 hari</SelectItem>
                        <SelectItem value="365">1 tahun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full">
                    Bersihkan Cache
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    Bersihkan Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
