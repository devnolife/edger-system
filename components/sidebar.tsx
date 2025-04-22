"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  DollarSign,
  PlusCircle,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"

export function Sidebar() {
  const pathname = usePathname()
  const { role } = useUserRole()

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Bagan Akun",
      icon: ListChecks,
      href: "/bagan-akun",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Entri Jurnal",
      icon: BookOpen,
      href: "/entri-jurnal",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Buku Besar",
      icon: FileText,
      href: "/buku-besar",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Anggaran",
      icon: DollarSign,
      href: "/anggaran",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Pengeluaran",
      icon: CreditCard,
      href: "/pengeluaran",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Anggaran Tambahan",
      icon: PlusCircle,
      href: "/anggaran-tambahan",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Laporan",
      icon: BarChart3,
      href: "/laporan",
      roles: ["superadmin", "admin", "operator"],
    },
    {
      label: "Manajemen Pengguna",
      icon: Users,
      href: "/pengguna",
      roles: ["superadmin", "admin"],
    },
    {
      label: "Pengaturan",
      icon: Settings,
      href: "/pengaturan",
      roles: ["superadmin"],
    },
  ]

  return (
    <div className="hidden gradient-sidebar lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:block lg:w-64 rounded-r-3xl z-30">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center px-4 pt-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/unismuh-logo.png" alt="Universitas Muhammadiyah Makassar" width={40} height={40} />
            <span className="font-display text-white text-lg font-bold">SiKePro UNISMUH</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-2 px-2">
            {routes
              .filter((route) => route.roles.includes(role))
              .map((route) => (
                <motion.div key={route.href} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant={pathname === route.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-white font-medium",
                      pathname === route.href ? "bg-white/20 hover:bg-white/30" : "hover:bg-white/10 opacity-80",
                    )}
                    asChild
                  >
                    <Link href={route.href} className="rounded-xl py-6">
                      <route.icon className="mr-3 h-5 w-5" />
                      {route.label}
                    </Link>
                  </Button>
                </motion.div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
