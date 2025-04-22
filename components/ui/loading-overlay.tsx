"use client"

import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({ isLoading, text = "Memuat...", className }: LoadingOverlayProps) {
  // Prevent scrolling when overlay is active
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity",
        className,
      )}
    >
      <div className="bg-white dark:bg-black rounded-xl p-6 shadow-lg">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}
