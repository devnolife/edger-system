"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import { getMonthlyExpenseData } from "@/app/actions/dashboard-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function FinancialSummary() {
  const [data, setData] = useState<{ name: string; pengeluaran: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getMonthlyExpenseData()
        if (result.success && result.data) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to fetch data")
          // Fallback data if there's an error
          setData([
            { name: "Jan", pengeluaran: 0 },
            { name: "Feb", pengeluaran: 0 },
            { name: "Mar", pengeluaran: 0 },
            { name: "Apr", pengeluaran: 0 },
            { name: "Mei", pengeluaran: 0 },
            { name: "Jun", pengeluaran: 0 },
          ])
        }
      } catch (error) {
        console.error("Error in FinancialSummary:", error)
        setError("An unexpected error occurred")
        // Fallback data
        setData([
          { name: "Jan", pengeluaran: 0 },
          { name: "Feb", pengeluaran: 0 },
          { name: "Mar", pengeluaran: 0 },
          { name: "Apr", pengeluaran: 0 },
          { name: "Mei", pengeluaran: 0 },
          { name: "Jun", pengeluaran: 0 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[350px]">
        <LoadingSpinner size="md" text="Memuat data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[350px] text-muted-foreground">
        <p>Gagal memuat data: {error}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" />
        <YAxis
          tickFormatter={(value) =>
            value >= 1000000
              ? `${(value / 1000000).toFixed(1)}jt`
              : value >= 1000
                ? `${(value / 1000).toFixed(0)}rb`
                : value.toString()
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            fontFamily: "var(--font-poppins)",
          }}
          formatter={(value) => [`Rp${Number(value).toLocaleString("id-ID")}`, "Pengeluaran"]}
        />
        <Legend />
        <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#6EC207" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
