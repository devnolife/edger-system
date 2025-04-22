"use client"

import type React from "react"

import { useState, useEffect, type ChangeEvent, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { formatRupiah, parseRupiah } from "@/lib/format-rupiah"

interface RupiahInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number
  onChange: (value: string) => void
}

export const RupiahInput = forwardRef<HTMLInputElement, RupiahInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>("")

    // Update display value when the actual value changes
    useEffect(() => {
      if (value) {
        const numericValue = typeof value === "string" ? parseRupiah(value) : value
        setDisplayValue(formatRupiah(numericValue))
      } else {
        setDisplayValue("Rp 0")
      }
    }, [value])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Remove all non-digit characters for processing
      const numericValue = inputValue.replace(/[^\d]/g, "")

      // Update the display value with proper formatting
      setDisplayValue(formatRupiah(numericValue))

      // Pass the raw numeric value to the parent component
      onChange(numericValue)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text when focused
      e.target.select()

      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          className={className}
        />
      </div>
    )
  },
)

RupiahInput.displayName = "RupiahInput"
