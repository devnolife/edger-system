"use server"

import { put } from "@vercel/blob"

/**
 * Uploads an image to Vercel Blob storage
 * @param formData FormData containing the image file
 * @returns Object with success status and image URL or error message
 */
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    // Validate file
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    const fileType = file.type
    if (!fileType.startsWith("image/")) {
      return { success: false, error: "File must be an image" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileName = `receipts/${timestamp}-${randomString}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      contentType: fileType,
    })

    return {
      success: true,
      url: blob.url,
      fileName: blob.pathname,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
