"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth-actions"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("_method", "POST") // Ensure POST method is used
      const result = await login(formData) as LoginResult

      if (result.success && result.user) {
        toast({
          title: "Login berhasil",
          description: "Mengalihkan ke dashboard...",
          variant: "default",
        })

        // Redirect based on user role
        const userRole = result.user.role
        if (userRole === "SUPERVISOR") {
          router.push("/supervisor")
        } else if (userRole === "OPERATOR") {
          router.push("/dashboard")
        } else {
          router.push("/dashboard") // Fallback
        }
      } else {
        setErrorMessage(result.error || "Login gagal, silakan coba lagi")
        toast({
          title: "Login gagal",
          description: result.error || "Kredensial tidak valid",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrorMessage("Terjadi kesalahan, silakan coba lagi")
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghubungi server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col justify-center md:flex-row md:justify-start">
      {/* Left side - decorative content */}
      <div className="hidden md:flex md:w-1/2 bg-teal-700 p-8 flex-col justify-between text-white">
        {/* Logos at the left side */}
        <div className="flex flex-row items-center justify-start gap-4 w-full">
          <Image
            src="/images/unismuh-logo.png"
            alt="Universitas Muhammadiyah"
            width={60}
            height={60}
            className="object-contain"
          />
          <Image
            src="/images/gift-unismuh.png"
            alt="Universitas Muhammadiyah Illustration"
            width={80}
            height={80}
            className="object-contain"
          />
          <Image
            src="/images/LOGO-AKREDITASI-UNGGUL.png"
            alt="Akreditasi Unggul"
            width={90}
            height={35}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col w-full items-center text-center">
          <h1 className="text-3xl font-bold">Sistem Manajemen Keuangan</h1>
          <p className="text-lg mt-4 opacity-80">
            Platform terintegrasi untuk pengelolaan dan pelaporan keuangan Universitas Muhammadiyah
          </p>
          <div className="w-full text-center text-sm opacity-70 mt-8">
            <p>© {new Date().getFullYear()} Universitas Muhammadiyah</p>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center bg-white">
        <div className="md:hidden flex flex-row items-center justify-start gap-2 mb-6 w-full">
          <Image
            src="/images/unismuh-logo.png"
            alt="Universitas Muhammadiyah"
            width={40}
            height={40}
            className="object-contain"
          />
          <Image
            src="/images/gift-unismuh.png"
            alt="Universitas Muhammadiyah Illustration"
            width={50}
            height={50}
            className="object-contain"
          />
          <Image
            src="/images/LOGO-AKREDITASI-UNGGUL.png"
            alt="Akreditasi Unggul"
            width={70}
            height={28}
            className="object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-center mb-2 md:hidden">Sistem Manajemen Keuangan</h1>
        <p className="text-gray-600 text-center text-sm mb-6 md:hidden">Universitas Muhammadiyah</p>

        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Masuk</CardTitle>
            <CardDescription className="text-center">
              Silakan masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" method="post">
              {errorMessage && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Nama Pengguna</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Masukkan nama pengguna"
                    className="pl-10 py-6"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Kata Sandi</Label>
                  <a href="#" className="text-sm text-teal-700 hover:text-teal-900 hover:underline">
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    className="pl-10 pr-10 py-6"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-6"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Hubungi administrator sistem jika Anda memerlukan bantuan
            </p>
          </CardFooter>
        </Card>

        <div className="mt-8 text-sm text-gray-500 md:hidden">
          <p className="text-center">© {new Date().getFullYear()} Universitas Muhammadiyah</p>
        </div>
      </div>
    </div>
  )
}
