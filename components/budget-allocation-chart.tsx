"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRupiah } from "@/lib/format-rupiah"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

interface BudgetAllocationChartProps {
  budgets: Array<{
    id: string
    name: string
    amount: number
    spentAmount: number
    availableAmount: number
    additionalAmount?: number
  }>
}

export function BudgetAllocationChart({ budgets }: BudgetAllocationChartProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")

  // Prepare data for charts
  const barChartData = budgets.map((budget) => {
    const mainBudget = budget.amount
    const additionalBudget = budget.additionalAmount || 0
    const spent = budget.spentAmount

    return {
      name: budget.name.length > 15 ? budget.name.substring(0, 15) + "..." : budget.name,
      "Anggaran Utama": mainBudget,
      "Alokasi Tambahan": additionalBudget,
      Terpakai: spent,
    }
  })

  // Prepare data for pie chart
  const pieChartData = budgets.map((budget) => ({
    name: budget.name.length > 20 ? budget.name.substring(0, 20) + "..." : budget.name,
    value: budget.amount + (budget.additionalAmount || 0),
  }))

  // Colors for pie chart - incorporating the new colors
  const COLORS = [
    "#3674B5", // Original blue
    "#4379F2", // New bright blue
    "#FFEB00", // New bright yellow
    "#6EC207", // New vibrant green
    "#117554", // New deep teal
    "#578FCA", // Original medium blue
    "#A1E3F9", // Original light blue
    "#8884d8", // Purple
    "#83a6ed", // Light blue
    "#8dd1e1", // Teal
    "#82ca9d", // Green
  ]

  return (
    <Card className="rounded-2xl border-none shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-display text-xl">Visualisasi Anggaran</CardTitle>
            <CardDescription>Perbandingan anggaran dan penggunaan</CardDescription>
          </div>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as "bar" | "pie")}>
            <TabsList className="grid w-[180px] grid-cols-2 rounded-full p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="bar"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Bar
              </TabsTrigger>
              <TabsTrigger
                value="pie"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Pie
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[400px]">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
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
                  formatter={(value) => [formatRupiah(value as number), ""]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="Anggaran Utama" fill="#3674B5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alokasi Tambahan" fill="#FFEB00" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Terpakai" fill="#6EC207" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatRupiah(value as number), "Anggaran"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
