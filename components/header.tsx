"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, Bell, User, Sparkles, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { useUserRole } from "@/hooks/use-user-role"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { logout } from "@/app/actions/auth-actions"
import { useRouter } from "next/navigation"

export function Header() {
  const { role, user } = useUserRole()
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/50 px-4 sm:px-6 lg:ml-64 w-full lg:w-[calc(100%-16rem)]">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="gradient-sidebar p-0 lg:hidden">
          <div className="flex h-14 items-center px-4 pt-6">
            <Link href="/" className="flex items-center gap-2 font-display text-white text-xl font-bold">
              <Sparkles className="h-6 w-6" />
              <span>SiKePro UNISMUH</span>
            </Link>
          </div>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3 lg:hidden">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-display font-bold text-lg">SiKePro UNISMUH</span>
      </div>

      {/* Logo section - visible on all screens */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/images/unismuh-logo.png"
            alt="Universitas Muhammadiyah Makassar"
            width={40}
            height={40}
            className="hidden md:block"
          />
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO-AKREDITASI-UNGGUL-1EoloT7SBWS1160hBsg07zHNISRMGV.png"
            alt="AKREDITASI UNGGUL"
            width={50}
            height={50}
            className="hidden md:block"
          />
          <Image
            src="/images/gift-unismuh.png"
            alt="GREEN ISLAMIC FUTURISTIC"
            width={50}
            height={50}
            className="hidden md:block"
          />
          <div className="hidden md:block">
            <p className="font-display font-bold text-sm leading-tight">Universitas Muhammadiyah Makassar</p>
            <p className="text-xs text-muted-foreground">Sistem Keuangan Proyek</p>
          </div>
        </div>
      </div>

      <div className="flex-1"></div>

      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-primary" />}
            <span className="sr-only">Ubah tema</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="outline" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
              3
            </span>
            <span className="sr-only">Notifikasi</span>
          </Button>
        </motion.div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full border border-primary/20 px-3">
                <Avatar className="h-7 w-7 border-2 border-primary">
                  <AvatarImage src="/placeholder-user.jpg" alt={user?.name} />
                  <AvatarFallback className="bg-primary text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden font-medium md:inline-flex">{user?.name || "Pengguna"}</span>
                <span className="hidden text-xs text-primary font-semibold md:inline-flex uppercase">{role}</span>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-primary/20 w-56">
            <DropdownMenuLabel className="font-display">Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer">
              <User className="mr-2 h-4 w-4 text-primary" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={handleLogout}>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
