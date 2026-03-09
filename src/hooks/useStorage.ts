import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StorageBucket = 'course-videos' | 'course-materials' | 'receipts' | 'avatars' | 'content' | 'comment-images' | 'book-covers' | 'notices' | 'chat-attachments';

export interface UploadResult {
  publicUrl: string;
  path: string;
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (
    bucket: StorageBucket,
    file: File,
    folder: string = ''
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      setProgress(100);

      // For public buckets, get public URL; for private, get signed URL
      const isPublic = ['content', 'avatars', 'book-covers', 'notices'].includes(bucket);
      
      if (isPublic) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { publicUrl, path: filePath };
      } else {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600);
        if (signError) throw signError;
        return { publicUrl: data.signedUrl, path: filePath };
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (
    bucket: StorageBucket,
    path: string
  ): Promise<boolean> => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      toast.error("Delete failed: " + error.message);
      return false;
    }
    return true;
  }, []);

  const getSignedUrl = useCallback(async (
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) return null;
    return data.signedUrl;
  }, []);

  const listFiles = useCallback(async (
    bucket: StorageBucket,
    folder: string = ''
  ) => {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    if (error) return [];
    return data || [];
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    deleteFile,
    getSignedUrl,
    listFiles,
  };
};
