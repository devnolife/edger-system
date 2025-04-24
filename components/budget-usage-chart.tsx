"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatRupiah } from "@/lib/format-rupiah"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import type { BudgetUsageChartData, BudgetUsageSummary, TimeFrame } from "@/app/actions/budget-history-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface BudgetUsageChartProps {
  chartData: BudgetUsageChartData[]
  summary: BudgetUsageSummary
  budgetName: string
  budgetAmount: number
  isLoading?: boolean
  onTimeFrameChange?: (timeFrame: TimeFrame) => void
}

export function BudgetUsageChart({
  chartData,
  summary,
  budgetName,
  budgetAmount,
  isLoading = false,
  onTimeFrameChange,
}: BudgetUsageChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "cumulative">("bar")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")

  // Calculate budget usage percentage
  const usagePercentage = budgetAmount > 0 ? (summary.totalAmount / budgetAmount) * 100 : 0

  // Determine progress color based on percentage using new colors
  const progressColor =
    usagePercentage > 90
      ? "bg-[#117554]" // Deep teal for critical
      : usagePercentage > 70
        ? "bg-[#FFEB00]" // Bright yellow for warning
        : "bg-[#6EC207]" // Vibrant green for good

  // Format date for display based on time frame
  const formatDate = (dateStr: string) => {
    try {
      if (timeFrame === "weekly") {
        const parts = dateStr.split("-")
        if (parts.length !== 2) return dateStr
        return `W${parts[1]} ${parts[0]}`
      } else if (timeFrame === "monthly") {
        const parts = dateStr.split("-")
        if (parts.length !== 2) return dateStr

        const year = Number.parseInt(parts[0])
        const month = Number.parseInt(parts[1]) - 1

        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
          return dateStr
        }

        const dateObj = new Date(year, month, 1)
        if (isNaN(dateObj.getTime())) {
          return dateStr
        }

        return format(dateObj, "MMMM yyyy", { locale: id })
      } else {
        // For daily, parse as ISO date
        const dateObj = new Date(dateStr)
        if (isNaN(dateObj.getTime())) {
          return dateStr
        }
        return format(dateObj, "d MMM yyyy", { locale: id })
      }
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateStr
    }
  }

  // Handle time frame change
  const handleTimeFrameChange = (value: string) => {
    const newTimeFrame = value as TimeFrame
    setTimeFrame(newTimeFrame)
    if (onTimeFrameChange) {
      onTimeFrameChange(newTimeFrame)
    }
  }

  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    if (name === "amount") return [formatRupiah(value), "Pengeluaran"]
    if (name === "cumulativeAmount") return [formatRupiah(value), "Total Kumulatif"]
    return [formatRupiah(value), name]
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-display">{budgetName}</CardTitle>
            <CardDescription>Riwayat penggunaan anggaran</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
              <SelectTrigger className="w-[140px] rounded-lg">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3 rounded-lg">
                <TabsTrigger value="bar" className="rounded-lg">
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line" className="rounded-lg">
                  Line
                </TabsTrigger>
                <TabsTrigger value="cumulative" className="rounded-lg">
                  Kumulatif
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[350px]">
            <LoadingSpinner size="lg" text="Memuat data..." />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex justify-center items-center h-[350px] text-muted-foreground">
            Tidak ada data penggunaan anggaran
          </div>
        ) : (
          <>
            <div className="h-[350px] mt-4">
              {chartType === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={formatTooltip}
                      labelFormatter={formatDate}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      name="Pengeluaran"
                      fill="#4379F2" // Using bright blue
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={formatTooltip}
                      labelFormatter={formatDate}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Pengeluaran"
                      stroke="#6EC207" // Using vibrant green
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartType === "cumulative" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={formatTooltip}
                      labelFormatter={formatDate}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cumulativeAmount"
                      name="Total Kumulatif"
                      stroke="#117554" // Using deep teal
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                  <p className="text-2xl font-semibold">{formatRupiah(summary.totalAmount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rata-rata Pengeluaran</p>
                  <p className="text-2xl font-semibold">{formatRupiah(summary.averageAmount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
                  <p className="text-2xl font-semibold">{summary.totalRecords}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Penggunaan Anggaran</span>
                  <span>
                    {formatRupiah(summary.totalAmount)} dari {formatRupiah(budgetAmount)} ({usagePercentage.toFixed(0)}
                    %)
                  </span>
                </div>
                <Progress value={usagePercentage} className={`h-3 rounded-full ${progressColor}`} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
