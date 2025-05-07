"use client"

import { AppLayout } from "@/components/app-layout"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/app/actions/auth-actions"

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/");
      }
    }

    checkAuth();
  }, [router]);

  return <AppLayout>{children}</AppLayout>
} 
