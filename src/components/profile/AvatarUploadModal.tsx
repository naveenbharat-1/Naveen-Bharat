import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Trash2, Loader2, X } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarUrl?: string | null;
  fullName?: string | null;
  onUploadComplete: (url: string | null) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      const maxDim = 512;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = (h / w) * maxDim; w = maxDim; }
        else { w = (w / h) * maxDim; h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
};

const AvatarUploadModal = ({ isOpen, onClose, userId, currentAvatarUrl, fullName, onUploadComplete }: AvatarUploadModalProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const compressed = await compressImage(selectedFile);
      const filePath = `${userId}/avatar_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast.success("Avatar updated!");
      onClose();
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) throw error;
      onUploadComplete(null);
      toast.success("Avatar removed");
      onClose();
    } catch (err: any) {
      toast.error("Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground">Change Avatar</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ProfileAvatar
            avatarUrl={preview || currentAvatarUrl}
            fullName={fullName}
            userId={userId}
            size="lg"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
              Choose Photo
            </Button>
            {currentAvatarUrl && (
              <Button
                variant="outline"
                className="gap-2 text-destructive border-destructive"
                onClick={handleRemove}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {preview && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Avatar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;
