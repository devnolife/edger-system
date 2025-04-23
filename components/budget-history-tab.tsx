"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { formatRupiah } from "@/lib/format-rupiah"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getBudgetUsageHistory, type TimeFrame } from "@/app/actions/budget-history-actions"
import { BudgetUsageChart } from "@/components/budget-usage-chart"

interface BudgetHistoryTabProps {
  budgetId: string
  budgetAmount?: number
}

export function BudgetHistoryTab({ budgetId, budgetAmount = 0 }: BudgetHistoryTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly")
  const [chartData, setChartData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalRecords: 0,
    totalAmount: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0,
    firstRecordDate: new Date().toISOString(),
    lastRecordDate: new Date().toISOString(),
  })
  const [budgetName, setBudgetName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getBudgetUsageHistory(budgetId, timeFrame)
        if (result.success) {
          setChartData(result.chartData)
          setSummary(result.summary)
          setBudgetName(result.budgetName)
        } else {
          setError(result.error || "Failed to fetch budget history")
          setChartData([])
          setSummary({
            totalRecords: 0,
            totalAmount: 0,
            averageAmount: 0,
            maxAmount: 0,
            minAmount: 0,
            firstRecordDate: new Date().toISOString(),
            lastRecordDate: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("Error fetching budget history:", error)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [budgetId, timeFrame])

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame)
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Pastikan tabel budget_usage_history sudah dibuat di database.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <BudgetUsageChart
        chartData={chartData}
        summary={summary}
        budgetName={budgetName}
        budgetAmount={budgetAmount}
        isLoading={isLoading}
        onTimeFrameChange={handleTimeFrameChange}
      />

      {!isLoading && summary.totalRecords > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Transaksi Terbaru</h3>
            <div className="space-y-3">
              {chartData
                .slice(-5)
                .reverse()
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{formatRupiah(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            if (timeFrame === "daily") {
                              // Safely parse the date string
                              const dateObj = new Date(item.date)
                              if (isNaN(dateObj.getTime())) {
                                return item.date // Fallback to raw string if invalid
                              }
                              return format(dateObj, "d MMMM yyyy", { locale: id })
                            } else if (timeFrame === "weekly") {
                              const parts = item.date.split("-")
                              if (parts.length !== 2) return item.date
                              return `Minggu ${parts[1]}, ${parts[0]}`
                            } else {
                              // Monthly
                              const parts = item.date.split("-")
                              if (parts.length !== 2) return item.date

                              const year = Number.parseInt(parts[0])
                              const month = Number.parseInt(parts[1]) - 1

                              if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
                                return item.date // Fallback to raw string if invalid
                              }

                              const dateObj = new Date(year, month, 1)
                              if (isNaN(dateObj.getTime())) {
                                return item.date // Fallback to raw string if invalid
                              }

                              return format(dateObj, "MMMM yyyy", { locale: id })
                            }
                          } catch (error) {
                            console.error("Error formatting date:", error)
                            return item.date // Fallback to raw string on any error
                          }
                        })()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Kumulatif</p>
                      <p className="font-medium">{formatRupiah(item.cumulativeAmount)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
