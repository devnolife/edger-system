/**
 * Format a date to a localized string
 * @param date Date to format
 * @param style Format style (default: 'medium')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | undefined | null,
  style: "short" | "medium" | "long" | "full" = "medium",
): string {
  if (!date) return "Pilih tanggal"

  try {
    // Jika input adalah string, coba kembalikan dalam format yang lebih baik jika memungkinkan
    if (typeof date === 'string') {
      // Coba parse tanggal string
      const dateObj = new Date(date);

      // Jika dateObj valid, format dengan DateTimeFormat
      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat("id-ID", {
          dateStyle: style,
        }).format(dateObj);
      }

      // Jika tidak valid, kembalikan string aslinya
      return date;
    }

    // Jika sudah berupa objek Date, format langsung
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: style,
    }).format(date as Date);
  } catch (error) {
    console.warn("Format date warning:", error);
    // Fallback ke string asli atau representasi string dari date
    return typeof date === 'string' ? date : String(date);
  }
}

/**
 * Format a date range for display
 * @param from Start date
 * @param to End date
 * @returns Formatted date range string
 */
export function formatDateRange(from: Date | string | undefined, to: Date | string | undefined): string {
  if (!from && !to) return "Pilih rentang tanggal"

  if (from && to) {
    return `${formatDate(from, "short")} - ${formatDate(to, "short")}`
  }

  if (from) {
    return `Dari ${formatDate(from, "short")}`
  }

  return `Sampai ${formatDate(to, "short")}`
}
