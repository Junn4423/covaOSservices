"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";
import httpClient, { uploadFile } from "@/lib/http";
import type { UploadedFile } from "@/types";

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();

  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.anh_dai_dien || "");

  const userInitials = user?.ho_ten
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        const result = await uploadFile("/storage/upload/image", file, { folder: "avatars" });
        const uploadedFile = result.data as unknown as UploadedFile;

        // Update avatar URL
        setAvatarUrl(uploadedFile.url);

        // Update user profile (optional - if API exists)
        // await api.users.updateAvatar(uploadedFile.url);

        // Update local state
        if (user) {
          setUser({ ...user, anh_dai_dien: uploadedFile.url });
        }

        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully!",
          variant: "default",
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload avatar",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and profile information
        </p>
      </div>

      {/* Avatar section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a new avatar image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={user?.ho_ten || ""} />
              <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <Button onClick={handleAvatarUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload New Avatar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          {avatarUrl && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Current avatar URL:</p>
              <a
                href={avatarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {avatarUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input value={user?.ho_ten || ""} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={user?.so_dien_thoai || ""} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user?.vai_tro || ""} readOnly className="mt-1 capitalize" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={user?.phong_ban || "N/A"} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <Input
                value={user?.trang_thai === 1 ? "Active" : "Inactive"}
                readOnly
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant information */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Your tenant/organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Organization Name</Label>
              <Input
                value={user?.doanh_nghiep?.ten_doanh_nghiep || "N/A"}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ma doanh nghiep</Label>
              <Input
                value={user?.doanh_nghiep?.ma_doanh_nghiep || "N/A"}
                readOnly
                className="mt-1 uppercase"
              />
            </div>
            <div>
              <Label>Tenant ID</Label>
              <Input
                value={user?.id_doanh_nghiep || "N/A"}
                readOnly
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label>User ID</Label>
              <Input
                value={user?.id || "N/A"}
                readOnly
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
