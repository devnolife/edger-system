import type React from "react"
import { Outfit, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { UserRoleProvider } from "@/hooks/use-user-role"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
})

export const metadata = {
  title: "SiKePro UNISMUH - Sistem Keuangan Proyek Universitas Muhammadiyah Makassar",
  description: "Sistem multi-tingkat general ledger Universitas Muhammadiyah Makassar",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} ${outfit.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <UserRoleProvider>
            <div className="relative min-h-screen overflow-hidden bg-[#fafafa] dark:bg-[#121212]">
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

              <div className="flex min-h-screen flex-col relative z-10">
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 lg:ml-64">{children}</main>
                </div>
              </div>
            </div>
          </UserRoleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
