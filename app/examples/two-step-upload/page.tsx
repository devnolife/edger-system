"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { finalizeUpload } from "@/app/actions/upload-actions";
import FileUploadTwoStep from "@/components/file-upload-two-step";
import { Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TwoStepUploadExample() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
  });
  const [receipt, setReceipt] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileUploadComplete = (fileData: any) => {
    setReceipt(fileData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.amount || !receipt) {
        setSaveResult({
          success: false,
          message: "Please fill out all fields and upload a receipt",
        });
        return;
      }

      // Upload the file to MinIO if we have temporary file data
      let fileUrl = null;
      let fileKey = null;

      if (receipt && !receipt.url) {
        // This is a temporary file that needs to be finalized
        const uploadResult = await finalizeUpload(receipt);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload file");
        }

        // Access the correct properties based on the uploadResult structure
        fileUrl = uploadResult.objectName ? `/${uploadResult.bucketName}/${uploadResult.objectName}` : null;
        fileKey = uploadResult.objectName || null;
      } else if (receipt && receipt.url) {
        // This is already a finalized file
        fileUrl = receipt.url;
        fileKey = receipt.key;
      }

      // In a real application, you would now save the complete form data to your database
      // including the file URL/key from MinIO
      const completeData = {
        ...formData,
        receiptUrl: fileUrl,
        receiptKey: fileKey,
      };


      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveResult({
        success: true,
        message: "Expense saved successfully!",
      });

      // Optionally reset the form
      // setFormData({ title: "", description: "", amount: "" });
      // setReceipt(null);
    } catch (error) {
      console.error("Error saving form:", error);
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred while saving",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Two-Step File Upload Example</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Expense title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Expense description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <FileUploadTwoStep
                    onUploadComplete={handleFileUploadComplete}
                    saveWithFormData={true}
                    label="Upload Receipt"
                  />
                </div>

                {saveResult && (
                  <Alert variant={saveResult.success ? "default" : "destructive"}>
                    <AlertTitle>{saveResult.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{saveResult.message}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Expense
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This example demonstrates a two-step file upload process:
              </p>

              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Step 1:</strong> Files are first uploaded to a temporary
                  location on the server when selected from the file input.
                </li>
                <li>
                  <strong>Step 2:</strong> Files are only uploaded to MinIO permanent
                  storage when the entire form is submitted.
                </li>
              </ol>

              <p className="text-sm text-muted-foreground">
                This approach provides several benefits:
              </p>

              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Better user experience with immediate file preview</li>
                <li>Reduced storage usage by only storing files that are actually submitted</li>
                <li>All form data and files can be saved in a single transaction</li>
                <li>Improved error handling and recovery</li>
              </ul>

              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="font-medium">Current Form Data:</h3>
                <pre className="text-xs overflow-auto mt-2">
                  {JSON.stringify(
                    {
                      ...formData,
                      receipt: receipt
                        ? {
                          filename: receipt.originalName || receipt.tempFilename,
                          tempId: receipt.tempId,
                          // Show only limited info to keep the display clean
                          ...receipt.url ? { url: receipt.url } : { tempFile: true }
                        }
                        : null
                    },
                    null, 2
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
