"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatRupiah } from "@/lib/format-rupiah"
import { Eye } from "lucide-react"
import { BudgetUpdateIndicator } from "@/components/budget-update-indicator"
import { BudgetHistoryTab } from "@/components/budget-history-tab"
import { AllocationHistoryTab } from "@/components/allocation-history-tab"
import type { Budget } from "@/app/actions/budget-actions"

interface BudgetDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: Budget
  expenses: Array<{
    id: string
    description: string
    amount: number
    date: string
    submittedBy: string
  }>
  isLoading: boolean
  isLoadingExpenses: boolean
  lastUpdate: { budgetId: string; expenseAmount: number } | null
}

export function BudgetDetailsDialog({
  open,
  onOpenChange,
  budget,
  expenses,
  isLoading,
  isLoadingExpenses,
  lastUpdate,
}: BudgetDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">{budget.name}</DialogTitle>
          <DialogDescription>Detail anggaran dan penggunaannya</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Memuat detail anggaran...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4 rounded-full p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="overview"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Ringkasan
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger
                value="allocations"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Alokasi Tambahan
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Riwayat Penggunaan
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">ID Anggaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{budget.id}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tanggal Pembuatan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{budget.startDate}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dibuat Oleh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{budget.createdBy}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Keuangan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anggaran Awal:</span>
                      <span className="font-medium">{formatRupiah(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Terpakai:</span>
                      <div className="text-right">
                        <span className="font-medium">{formatRupiah(budget.spentAmount)}</span>
                        <BudgetUpdateIndicator
                          budgetId={budget.id}
                          lastUpdateBudgetId={lastUpdate?.budgetId}
                          expenseAmount={lastUpdate?.expenseAmount || 0}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alokasi Tambahan:</span>
                      <span className="font-medium">{formatRupiah(budget.additionalAmount || 0)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Sisa Anggaran:</span>
                      <div className="text-right">
                        <span>{formatRupiah(budget.availableAmount)}</span>
                        {lastUpdate && lastUpdate.budgetId === budget.id && (
                          <div className="text-xs text-green-600 font-medium mt-1">Baru diperbarui</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Penggunaan Anggaran</span>
                        <span>{((budget.spentAmount / budget.amount) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(budget.spentAmount / budget.amount) * 100} className="h-3 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pengeluaran Terkait</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingExpenses ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">Belum ada pengeluaran untuk anggaran ini.</p>
                      <Button className="rounded-full" asChild>
                        <a href={`/pengeluaran?budget=${budget.id}`}>Tambah Pengeluaran</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        {expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <h4 className="font-medium">{expense.description}</h4>
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>{expense.date}</span>
                                <span>•</span>
                                <span>Oleh: {expense.submittedBy}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatRupiah(expense.amount)}</div>
                              <Button variant="ghost" size="sm" className="mt-1 h-8 rounded-full" asChild>
                                <a href={`/pengeluaran?expense=${expense.id}`}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Detail
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Total {expenses.length} pengeluaran</p>
                          <p className="font-medium">
                            Total: {formatRupiah(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                          </p>
                        </div>
                        <Button className="rounded-full" asChild>
                          <a href={`/pengeluaran?budget=${budget.id}`}>Lihat Semua Pengeluaran</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Allocations Tab */}
            <TabsContent value="allocations" className="mt-4">
              <AllocationHistoryTab budgetId={budget.id} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Penggunaan Anggaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <BudgetHistoryTab budgetId={budget.id} budgetAmount={budget.amount} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
