"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UploadCloud, X, Check, Bug, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { uploadImage } from "@/app/actions/upload-actions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Set to true to enable debug mode with detailed logging in the UI
const DEBUG_MODE = true;

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

  // Debug state
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states for a new upload attempt
    setError(null)
    setIsSuccess(false)
    setDebugInfo(null)

    // Log file details for debugging
    if (DEBUG_MODE) {
      console.log("[Upload Debug] File selected:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload the file
    setIsUploading(true)

    try {
      console.log("[Upload Debug] Starting upload process");
      const formData = new FormData()
      formData.append("file", file)

      console.log("[Upload Debug] Calling uploadImage server action");
      const result = await uploadImage(formData)
      console.log("[Upload Debug] Server response:", result);

      // Store full result for debug display
      setDebugInfo(result);

      if (result.success && result.url) {
        console.log("[Upload Debug] Upload successful, URL:", result.url);
        onImageUploaded(result.url)
        setIsSuccess(true)
        setError(null)
      } else {
        console.error("[Upload Debug] Upload failed:", result);
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
      console.error("[Upload Debug] Exception during upload:", err);
      setDebugInfo({
        unexpectedError: true,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });

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
    setDebugInfo(null)
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

        {DEBUG_MODE && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug {showDebugInfo ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        )}
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
            {isUploading && previewUrl && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10">
                <LoadingSpinner size="md" text="Mengunggah..." />
              </div>
            )}
            <Image src={previewUrl || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
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
          Foto berhasil diunggah dan siap disimpan.
        </p>
      )}

      {/* Debug Information Display */}
      {DEBUG_MODE && debugInfo && showDebugInfo && (
        <div className="mt-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded-md p-3 text-xs font-mono overflow-x-auto">
          <h4 className="font-bold mb-2 text-yellow-800 dark:text-yellow-400">Debug Info</h4>

          {/* Success Status */}
          <div className="mb-2">
            <span className="font-semibold">Status: </span>
            <span className={debugInfo.success ? "text-green-600" : "text-red-600"}>
              {debugInfo.success ? "SUCCESS" : "FAILED"}
            </span>
          </div>

          {/* Error Details */}
          {debugInfo.error && (
            <div className="mb-2">
              <span className="font-semibold">Error: </span>
              <span className="text-red-600">{debugInfo.error}</span>
            </div>
          )}

          {/* Error Type */}
          {debugInfo.errorType && (
            <div className="mb-2">
              <span className="font-semibold">Error Type: </span>
              <span className="text-red-600">{debugInfo.errorType}</span>
            </div>
          )}

          {/* URL if present */}
          {debugInfo.url && (
            <div className="mb-2">
              <span className="font-semibold">URL: </span>
              <span className="text-green-600">{debugInfo.url.substring(0, 50)}...</span>
            </div>
          )}

          {/* Key if present */}
          {debugInfo.key && (
            <div className="mb-2">
              <span className="font-semibold">Key: </span>
              <span>{debugInfo.key}</span>
            </div>
          )}

          {/* Additional Details */}
          {debugInfo.details && (
            <div className="mb-2">
              <div className="font-semibold mb-1">Details:</div>
              <pre className="whitespace-pre-wrap bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                {JSON.stringify(debugInfo.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Full Response for Advanced Debugging */}
          <div className="mt-2">
            <div className="font-semibold mb-1">Full Response:</div>
            <pre className="whitespace-pre-wrap bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
