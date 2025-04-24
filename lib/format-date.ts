/**
 * Format a date to a localized string
 * @param date Date to format
 * @param style Format style (default: 'medium')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | undefined | null,
  style: "short" | "medium" | "long" | "full" = "medium",
): string {
  if (!date) return "Pilih tanggal"

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: style,
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(date)
  }
}

/**
 * Format a date range for display
 * @param from Start date
 * @param to End date
 * @returns Formatted date range string
 */
export function formatDateRange(from: Date | undefined, to: Date | undefined): string {
  if (!from && !to) return "Pilih rentang tanggal"

  if (from && to) {
    return `${formatDate(from, "short")} - ${formatDate(to, "short")}`
  }

  if (from) {
    return `Dari ${formatDate(from, "short")}`
  }

  return `Sampai ${formatDate(to, "short")}`
}
