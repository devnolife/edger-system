/**
 * Format a number to Indonesian Rupiah format
 * @param value Number or string to format
 * @returns Formatted string in Rupiah format (e.g., "Rp 1.000.000")
 */
export function formatRupiah(value: number | string): string {
  // Convert to number if it's a string
  let numericValue: number

  if (typeof value === "string") {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.-]/g, "")
    numericValue = Number.parseFloat(cleanValue)
  } else {
    numericValue = value
  }

  // Handle NaN
  if (isNaN(numericValue)) {
    return "Rp 0"
  }

  // Format the number with Indonesian locale
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

/**
 * Parse a Rupiah formatted string back to a number
 * @param value Rupiah formatted string (e.g., "Rp 1.000.000")
 * @returns Number value
 */
export function parseRupiah(value: string): number {
  if (!value) return 0

  // Remove currency symbol, dots, and commas
  const numericString = value
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")

  // Parse to float
  const parsedValue = Number.parseFloat(numericString)

  // Return 0 if parsing failed
  return isNaN(parsedValue) ? 0 : parsedValue
}
