"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { processUploadedFile, finalizeUpload } from "@/app/actions/upload-actions";
import { AlertCircle, CheckCircle, FileImage, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

interface FileWithPreview {
  id: string;
  tempFile: any;
  previewUrl: string;
}

export default function FileUploadTwoStep({
  onUploadComplete,
  saveWithFormData = false,
  label = "Upload File"
}: {
  onUploadComplete: (fileData: any) => void;
  saveWithFormData?: boolean;
  label?: string;
}) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const file = selectedFiles[0]; // Only handling single file for now
      const formData = new FormData();
      formData.append("file", file);

      const result = await processUploadedFile(formData);

      if (result.success) {
        // Add file to list with preview
        setFiles([
          ...files,
          {
            id: Date.now().toString(),
            tempFile: result.tempFile,
            previewUrl: result.previewUrl
          }
        ]);
      } else {
        setError(result.error || "Failed to process file");
        console.error("Upload failed:", result);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handleSave = async () => {
    if (files.length === 0) {
      setError("No files to save");
      return;
    }

    setFinalizing(true);
    setError(null);

    try {
      // If only one file is allowed/present:
      const fileData = files[0];

      if (saveWithFormData) {
        // Just pass the temporary file data to the parent component
        // The parent will be responsible for calling finalizeUpload when saving the entire form
        onUploadComplete(fileData.tempFile);
      } else {
        // Upload to MinIO immediately
        const uploadResult = await finalizeUpload(fileData.tempFile);

        if (uploadResult.success) {
          onUploadComplete({
            url: uploadResult.url,
            key: uploadResult.key,
            originalName: fileData.tempFile.originalName
          });

          // Clear the files list after successful upload
          setFiles([]);
        } else {
          setError(uploadResult.error || "Failed to upload to storage");
        }
      }
    } catch (err) {
      setError("Error saving files");
      console.error("Error in save:", err);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">{files.length === 0 ? "Select File" : "Change File"}</Label>
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading || finalizing}
            />
          </div>

          {uploading && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing file...</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Preview:</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {files.map(file => (
                  <div key={file.id} className="relative border rounded-md p-2">
                    <div className="aspect-video relative">
                      {file.previewUrl ? (
                        <Image
                          src={file.previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain rounded-md"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs truncate max-w-[160px]">
                        {file.tempFile.originalName}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveFile(file.id)}
                        disabled={finalizing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setFiles([])}
          disabled={files.length === 0 || uploading || finalizing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={files.length === 0 || uploading || finalizing}
        >
          {finalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {saveWithFormData ? "Confirming" : "Uploading"}
            </>
          ) : (
            <>
              {saveWithFormData ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {saveWithFormData ? "Confirm Selection" : "Save to Server"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 
