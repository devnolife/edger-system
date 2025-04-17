"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

export function FinancialSummary() {
  const data = [
    {
      name: "Jan",
      pengeluaran: 2400,
    },
    {
      name: "Feb",
      pengeluaran: 1398,
    },
    {
      name: "Mar",
      pengeluaran: 9800,
    },
    {
      name: "Apr",
      pengeluaran: 3908,
    },
    {
      name: "Mei",
      pengeluaran: 4800,
    },
    {
      name: "Jun",
      pengeluaran: 3800,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
        />
        <Legend />
        <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
