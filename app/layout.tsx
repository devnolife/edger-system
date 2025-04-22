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
  title: "SisKeu - Sistem Keuangan Terpadu",
  description: "Sistem multi-tingkat general ledger dengan akses berbasis peran",
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
              {/* Dekorasi blob */}
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
              <div className="blob blob-3"></div>

              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
                </div>
              </div>
            </div>
          </UserRoleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
