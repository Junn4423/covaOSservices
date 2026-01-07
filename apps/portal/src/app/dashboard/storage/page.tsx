"use client";

import { useState, useRef, useCallback } from "react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState("avatars");
  const [isDragOver, setIsDragOver] = useState(false);

  // Check storage status
  const checkStatus = async () => {
    try {
      const response = await api.storage.getStatus();
      setStorageStatus(response.data.status);
      toast({
        title: "Trang thai luu tru",
        description: response.data.status === "healthy"
          ? "Dich vu luu tru hoat dong binh thuong"
          : "Dich vu luu tru chua duoc cau hinh",
        variant: response.data.status === "healthy" ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Loi",
        description: error.message || "Khong the kiem tra trang thai luu tru",
        variant: "destructive",
      });
    }
  };

  // Upload file with progress tracking
  const uploadFileWithProgress = async (file: File, folder: string): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error("Phan hoi tu server khong hop le"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || "Tai len that bai"));
          } catch {
            reject(new Error("Tai len that bai"));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Loi mang khi tai len"));
      });

      xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/storage/upload`);

      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  };

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processUpload(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process file upload
  const processUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFile = await uploadFileWithProgress(file, selectedFolder);
      setUploadedFiles((prev) => [uploadedFile, ...prev]);

      toast({
        title: "Tai len thanh cong",
        description: `${uploadedFile.originalName} da duoc tai len!`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Tai len that bai",
        description: error.message || "Khong the tai len tap tin",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
      await processUpload(file);
    };
    input.click();
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUpload(file);
    }
  }, [selectedFolder]);

  // Delete file
  const handleDelete = async (fileId: string) => {
    try {
      await api.storage.delete(fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      toast({
        title: "Da xoa tap tin",
        description: "Tap tin da duoc xoa khoi he thong luu tru",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Xoa that bai",
        description: error.message || "Khong the xoa tap tin",
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
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Quan ly Luu tru
        </h2>
        <p className="text-muted-foreground">
          Tai len va quan ly tap tin voi MinIO/S3
        </p>
      </div>

      {/* Status check */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Trang thai Luu tru</CardTitle>
          <CardDescription>
            Kiem tra xem dich vu luu tru da duoc cau hinh chua
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={checkStatus} variant="outline" className="transition-all duration-200 hover:shadow-md">
              Kiem tra trang thai
            </Button>
            {storageStatus && (
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${storageStatus === "healthy" ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                    }`}
                />
                <span className="text-sm">
                  {storageStatus === "healthy" ? "Luu tru san sang" : "Luu tru chua cau hinh"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload section with drag and drop */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Tai len Tap tin</CardTitle>
          <CardDescription>
            Tai len hinh anh hoac tai lieu len he thong luu tru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and drop area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
          >
            <div className="space-y-2">
              <div className="text-4xl text-gray-400">+</div>
              <p className="text-sm text-muted-foreground">
                Keo va tha tap tin vao day hoac
              </p>
              <Button
                onClick={handleImageUpload}
                disabled={isUploading}
                variant="outline"
                className="transition-all duration-200"
              >
                {isUploading ? "Dang tai len..." : "Chon tap tin"}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dang tai len...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            {/* Folder selection */}
            <div className="mb-4">
              <Label htmlFor="folder">Thu muc luu tru</Label>
              <select
                id="folder"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="avatars">avatars (Anh dai dien)</option>
                <option value="documents">documents (Tai lieu)</option>
                <option value="images">images (Hinh anh)</option>
                <option value="contracts">contracts (Hop dong)</option>
              </select>
            </div>

            {/* File input */}
            <div>
              <Label htmlFor="file">Chon tap tin</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleUpload}
                disabled={isUploading}
                className="mt-1 max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ho tro: Hinh anh (toi da 5MB), PDF (toi da 20MB), Tai lieu (toi da 20MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded files list */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Tap tin da tai len</CardTitle>
          <CardDescription>
            Danh sach tap tin da tai len trong phien lam viec nay
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-12 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-4xl text-gray-300 mb-2">?</div>
              <p className="text-sm text-muted-foreground">
                Chua co tap tin nao duoc tai len. Tai len tap tin de xem o day.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Preview (for images) */}
                  {file.mimeType.startsWith("image/") ? (
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
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
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
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
                      className="transition-all duration-200 hover:bg-blue-50"
                    >
                      Xem
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.fileId)}
                      className="transition-all duration-200"
                    >
                      Xoa
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
