"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatRupiah } from "@/lib/format-rupiah"

// Define a budget update event type
export type BudgetUpdateEvent = {
  budgetId: string
  expenseAmount: number
  timestamp: number
}

// Global event emitter system
const listeners: ((event: BudgetUpdateEvent) => void)[] = []
let latestUpdate: BudgetUpdateEvent | null = null

// Function to emit a budget update event
export function emitBudgetUpdate(budgetId: string, expenseAmount: number) {
  const event: BudgetUpdateEvent = {
    budgetId,
    expenseAmount,
    timestamp: Date.now(),
  }

  // Store the latest update
  latestUpdate = event

  // Notify all listeners
  listeners.forEach((listener) => listener(event))
}

// Hook to subscribe to budget updates
export function useBudgetUpdates(callback?: (event: BudgetUpdateEvent) => void) {
  const { toast } = useToast()
  const [lastUpdate, setLastUpdate] = useState<BudgetUpdateEvent | null>(latestUpdate)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Handler for budget updates with debouncing
  const handleBudgetUpdate = useCallback(
    (event: BudgetUpdateEvent) => {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set a new timer to debounce updates
      debounceTimerRef.current = setTimeout(() => {
        // Update the last update state
        setLastUpdate(event)

        // Show a toast notification
        toast({
          title: "Anggaran Diperbarui",
          description: `Anggaran telah dikurangi sebesar ${formatRupiah(event.expenseAmount)}`,
        })

        // Call the callback if provided
        if (callback) {
          callback(event)
        }
      }, 300) // 300ms debounce time
    },
    [callback, toast],
  )

  // Subscribe to budget updates
  useEffect(() => {
    // Add the listener
    listeners.push(handleBudgetUpdate)

    // Cleanup function to remove the listener and clear any pending timers
    return () => {
      const index = listeners.indexOf(handleBudgetUpdate)
      if (index !== -1) {
        listeners.splice(index, 1)
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [handleBudgetUpdate])

  // Return the last update
  return { lastUpdate }
}
