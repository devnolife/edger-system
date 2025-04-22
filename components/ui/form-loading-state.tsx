import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormLoadingStateProps {
  isLoading: boolean
  className?: string
  loadingText?: string
}

export function FormLoadingState({ isLoading, className, loadingText = "Memproses..." }: FormLoadingStateProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10 rounded-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-primary">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{loadingText}</span>
      </div>
    </div>
  )
}
