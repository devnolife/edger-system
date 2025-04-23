"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatRupiah } from "@/lib/format-rupiah"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { motion } from "framer-motion"
import { getBudgets } from "@/app/actions/budget-actions"
import { getBudgetUsageHistory, getRecentBudgetUsage, type TimeFrame } from "@/app/actions/budget-history-actions"
import { BudgetUsageChart } from "@/components/budget-usage-chart"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"

export default function BudgetHistoryPage() {
  const { toast } = useToast()
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("")
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly")
  const [budgets, setBudgets] = useState<{ id: string; name: string; amount: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(false)
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
  const [budgetAmount, setBudgetAmount] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Fetch budgets on component mount
  useEffect(() => {
    const fetchBudgets = async () => {
      setIsLoading(true)
      try {
        const result = await getBudgets()
        if (result.success) {
          const formattedBudgets = result.budgets.map((budget) => ({
            id: budget.id,
            name: budget.name,
            amount: budget.amount,
          }))
          setBudgets(formattedBudgets)

          // Select the first budget by default if available
          if (formattedBudgets.length > 0 && !selectedBudgetId) {
            setSelectedBudgetId(formattedBudgets[0].id)
            setBudgetAmount(formattedBudgets[0].amount)
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to fetch budgets",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching budgets:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchRecentActivity = async () => {
      try {
        const result = await getRecentBudgetUsage(10)
        if (result.success) {
          setRecentActivity(result.records)
        }
      } catch (error) {
        console.error("Error fetching recent activity:", error)
      }
    }

    fetchBudgets()
    fetchRecentActivity()
  }, [toast])

  // Fetch budget history when selected budget changes
  useEffect(() => {
    if (!selectedBudgetId) return

    const fetchBudgetHistory = async () => {
      setIsChartLoading(true)
      try {
        const result = await getBudgetUsageHistory(selectedBudgetId, timeFrame)
        if (result.success) {
          setChartData(result.chartData)
          setSummary(result.summary)
          setBudgetName(result.budgetName)

          // Find the budget amount
          const budget = budgets.find((b) => b.id === selectedBudgetId)
          if (budget) {
            setBudgetAmount(budget.amount)
          }
        } else {
          toast({
            title: "Warning",
            description: result.error || "Failed to fetch budget history",
            variant: "default",
          })
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
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsChartLoading(false)
      }
    }

    fetchBudgetHistory()
  }, [selectedBudgetId, timeFrame, budgets, toast])

  const handleBudgetChange = (value: string) => {
    setSelectedBudgetId(value)
  }

  const handleTimeFrameChange = (value: TimeFrame) => {
    setTimeFrame(value)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={container}>
      {/* Header section */}
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Riwayat Penggunaan Anggaran
          </h2>
          <p className="text-muted-foreground">Analisis dan pantau penggunaan anggaran dari waktu ke waktu</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedBudgetId} onValueChange={handleBudgetChange}>
            <SelectTrigger className="w-[250px] rounded-full border-primary/20">
              <SelectValue placeholder="Pilih anggaran" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <LoadingSpinner size="lg" text="Memuat data anggaran..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart section */}
          <motion.div variants={item} className="lg:col-span-2">
            <BudgetUsageChart
              chartData={chartData}
              summary={summary}
              budgetName={budgetName}
              budgetAmount={budgetAmount}
              isLoading={isChartLoading}
              onTimeFrameChange={handleTimeFrameChange}
            />
          </motion.div>

          {/* Recent activity section */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Belum ada aktivitas penggunaan anggaran</div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex justify-between border-b pb-3">
                        <div>
                          <p className="font-medium">{activity.expenseDescription || "Pengeluaran"}</p>
                          <p className="text-xs text-muted-foreground">{activity.budgetName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(activity.recordedAt), "d MMMM yyyy, HH:mm", { locale: id })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatRupiah(activity.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
