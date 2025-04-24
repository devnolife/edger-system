"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UploadCloud, X, Check } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/app/actions/upload-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  className?: string
}

export function ImageUpload({ onImageUploaded, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setIsSuccess(false)

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload the file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.success && result.url) {
        onImageUploaded(result.url)
        setIsSuccess(true)
      } else {
        setError(result.error || "Failed to upload image")
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error uploading image:", err)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } finally {
      setIsUploading(false)
    }

    // Clean up the object URL to avoid memory leaks
    return () => URL.revokeObjectURL(objectUrl)
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    setIsSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="receipt-image">
        Foto Bukti Pengeluaran <span className="text-red-500">*</span>
      </Label>

      {!previewUrl ? (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:bg-primary/5 transition-colors">
          <input
            type="file"
            id="receipt-image"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <label htmlFor="receipt-image" className="flex flex-col items-center justify-center cursor-pointer">
            <UploadCloud className="h-10 w-10 text-primary/50 mb-2" />
            <p className="text-sm font-medium mb-1">Klik untuk unggah foto bukti</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, atau GIF (Maks. 5MB)</p>
          </label>
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden">
          <div className="aspect-video relative">
            <Image src={previewUrl || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            {isSuccess && (
              <div className="bg-green-500 text-white p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
            )}
            <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={handleRemoveImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <LoadingSpinner size="md" text="Mengunggah..." />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {isSuccess && (
        <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
          <Check className="h-4 w-4" />
          Foto berhasil diunggah
        </p>
      )}
    </div>
  )
}
