"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentJournalEntries } from "@/components/recent-journal-entries"
import { FinancialSummary } from "@/components/financial-summary"
import { useUserRole } from "@/hooks/use-user-role"
import { motion } from "framer-motion"
import { ArrowUp, Activity, FileText, FilePlus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getDashboardSummary } from "@/app/actions/dashboard-actions"
import { formatRupiah } from "@/lib/format-rupiah"

export default function OperatorDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Operator Dashboard</h1>
      <p className="mt-4 text-gray-600">Welcome to the operator dashboard. This is where operators can manage system functions.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Anggaran</h2>
          <p className="text-gray-600">Manage budget items and allocations</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Pengeluaran</h2>
          <p className="text-gray-600">Track and record expenses</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Anggaran Tambahan</h2>
          <p className="text-gray-600">Manage additional budget requirements</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Entri Jurnal</h2>
          <p className="text-gray-600">Create and edit journal entries</p>
        </div>
      </div>
    </div>
  );
}
