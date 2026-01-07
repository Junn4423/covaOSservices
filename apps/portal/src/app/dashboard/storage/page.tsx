"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { UploadedFile } from "@/types";

export default function StorageDemoPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("avatars");

  // Check storage status
  const checkStatus = async () => {
    try {
      const response = await api.storage.getStatus();
      setStorageStatus(response.data.status);
      toast({
        title: "Storage Status",
        description: response.data.message,
        variant: response.data.status === "healthy" ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check storage status",
        variant: "destructive",
      });
    }
  };

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await api.storage.upload(file, selectedFolder);
      const uploadedFile = response.data as UploadedFile;

      setUploadedFiles((prev) => [uploadedFile, ...prev]);

      toast({
        title: "Upload Successful",
        description: `${uploadedFile.originalName} uploaded successfully!`,
        variant: "default",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image upload specifically
  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        const response = await api.storage.uploadImage(file, "avatars");
        const uploadedFile = response.data as UploadedFile;

        setUploadedFiles((prev) => [uploadedFile, ...prev]);

        toast({
          title: "Image Uploaded",
          description: `Avatar uploaded successfully!`,
          variant: "default",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  // Delete file
  const handleDelete = async (fileId: string) => {
    try {
      await api.storage.delete(fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      toast({
        title: "File Deleted",
        description: "File has been removed from storage",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Storage Demo</h2>
        <p className="text-muted-foreground">
          Test file upload functionality with MinIO/S3 integration
        </p>
      </div>

      {/* Status check */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Status</CardTitle>
          <CardDescription>
            Check if the storage service is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={checkStatus} variant="outline">
              Check Status
            </Button>
            {storageStatus && (
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    storageStatus === "healthy" ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm">
                  {storageStatus === "healthy" ? "Storage is available" : "Storage not configured"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload images or documents to the storage bucket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar upload button */}
          <div>
            <Button
              onClick={handleImageUpload}
              disabled={isUploading}
              className="mr-4"
            >
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Quick upload for profile avatars (images only)
            </span>
          </div>

          <div className="border-t pt-4">
            {/* Folder selection */}
            <div className="mb-4">
              <Label htmlFor="folder">Target Folder</Label>
              <select
                id="folder"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="avatars">avatars</option>
                <option value="documents">documents</option>
                <option value="images">images</option>
                <option value="contracts">contracts</option>
              </select>
            </div>

            {/* File input */}
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleUpload}
                disabled={isUploading}
                className="mt-1 max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported: Images (5MB max), PDFs (20MB max), Documents (20MB max)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded files list */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            Files uploaded during this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No files uploaded yet. Upload a file to see it here.
            </p>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {/* Preview (for images) */}
                  {file.mimeType.startsWith("image/") ? (
                    <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl text-gray-400">F</span>
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.originalName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} - {file.mimeType}
                    </p>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {file.url}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.fileId)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
