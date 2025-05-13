"use client"

import { useEffect, useState } from "react"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/format-date"
import { formatRupiah } from "@/lib/format-rupiah"
import { getExpenses } from "@/app/actions/expense-actions"
import { getBudgets } from "@/app/actions/budget-actions"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

interface Activity {
  id: string
  type: "expense" | "budget"
  description: string
  amount?: number
  date: string
  operator: string
  status: string
}

export default function SupervisorPage() {
  const { user, role } = useUserRole()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Redirect if not supervisor
    if (role !== "SUPERVISOR") {
      router.push("/dashboard")
      return
    }

    const fetchActivities = async () => {
      try {
        setIsLoading(true)

        // Fetch expenses
        const expensesResult = await getExpenses()
        const expenses = expensesResult.success ? expensesResult.expenses : []

        // Fetch budgets
        const budgetsResult = await getBudgets()
        const budgets = budgetsResult.success ? budgetsResult.budgets : []

        // Combine and format activities
        const formattedActivities: Activity[] = [
          ...(expenses?.map(expense => ({
            id: expense.id,
            type: "expense" as const,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            operator: expense.submittedBy,
            status: expense.additionalAllocationId ? "Dengan Alokasi Tambahan" : "Reguler"
          })) || []),
          ...(budgets?.map(budget => ({
            id: budget.id,
            type: "budget" as const,
            description: budget.name,
            amount: Number(budget.amount),
            date: new Date(budget.startDate).toISOString().split("T")[0],
            operator: budget.createdBy,
            status: "Anggaran"
          })) || [])
        ]

        // Sort by date descending
        formattedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setActivities(formattedActivities)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [role, router])

  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === "all") return true
    if (activeTab === "expenses") return activity.type === "expense"
    if (activeTab === "budgets") return activity.type === "budget"
    return true
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Supervisor</h1>
        <p className="text-muted-foreground">Monitor aktivitas operator</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(activities.reduce((sum, act) => sum + (act.amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operator Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activities.map(act => act.operator)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Operator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
              <TabsTrigger value="budgets">Anggaran</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                          <p className="mt-2 text-muted-foreground">Memuat data...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{formatDate(new Date(activity.date))}</TableCell>
                          <TableCell>{activity.operator}</TableCell>
                          <TableCell>{activity.description}</TableCell>
                          <TableCell>{activity.amount ? formatRupiah(activity.amount) : "-"}</TableCell>
                          <TableCell>{activity.status}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LoadingOverlay isLoading={isLoading} />
    </div>
  )
} 
