"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UploadCloud, X, Check } from "lucide-react"
import Image from "next/image"
import { processUploadedFile } from "@/app/actions/upload-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  onImageUploaded: (url: string, tempFileData?: any) => void
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

    // Reset states for a new upload attempt
    setError(null)
    setIsSuccess(false)

    // Upload the file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await processUploadedFile(formData)

      if (result.success) {
        // Check if the response contains previewUrl
        if (result.previewUrl) {
          // Create a preview
          setPreviewUrl(result.previewUrl)
          // Pass both the URL and the temp file data to parent component
          onImageUploaded(result.previewUrl, result.tempFile)
          setIsSuccess(true)
          setError(null)
        } else {
          // In case the upload was processed but no URL was returned
          setError("Berkas berhasil diproses tetapi tidak ada URL yang dikembalikan.")
        }
      } else {
        let displayError = result.error || "Gagal mengunggah gambar."

        // Enhanced error display
        setError(displayError)
        setPreviewUrl(null)
        setIsSuccess(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan tak terduga saat mengunggah.")
      setPreviewUrl(null)
      setIsSuccess(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    setError(null)
    setIsSuccess(false)
    onImageUploaded("", null) // Clear the image URL and temp file data
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <Label htmlFor="receipt-image">
          Foto Bukti Pengeluaran <span className="text-red-500">*</span>
        </Label>
      </div>

      {!previewUrl && !isUploading ? (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:bg-primary/5 transition-colors">
          <input
            type="file"
            id="receipt-image"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            key={fileInputRef.current?.value || Date.now().toString()}
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
            {isUploading && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10">
                <LoadingSpinner size="md" text="Mengunggah..." />
              </div>
            )}
            {previewUrl && (
              <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
            )}
          </div>
          {!isUploading && previewUrl && (
            <div className="absolute top-2 right-2 flex gap-2 z-20">
              {isSuccess && (
                <div className="bg-green-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              )}
              <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={handleRemoveImage}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {isUploading && !previewUrl && (
        <div className="flex items-center justify-center mt-2">
          <LoadingSpinner size="sm" text="Memproses file..." />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {isSuccess && previewUrl && (
        <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
          <Check className="h-4 w-4" />
          Berhasil Diunggah
        </p>
      )}
    </div>
  )
}
