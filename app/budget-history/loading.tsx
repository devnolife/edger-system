import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
      <LoadingSpinner size="lg" text="Memuat riwayat anggaran..." />
    </div>
  )
}
