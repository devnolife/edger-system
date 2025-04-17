import { redirect } from "next/navigation"

export default function Home() {
  // Dalam aplikasi nyata, Anda akan memeriksa autentikasi di sini
  // Untuk demo, kita akan mengalihkan ke dashboard
  redirect("/dashboard")
}
