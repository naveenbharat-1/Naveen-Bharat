import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Comment {
  id: string;
  lessonId: string | null;
  userName: string;
  message: string;
  imageUrl: string | null;
  createdAt: string | null;
}

export interface CommentInput {
  lessonId: string;
  message: string;
  imageUrl?: string;
}

export const useComments = (lessonId?: string) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!lessonId) {
        setComments([]);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("comments")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (dbError) throw dbError;

      const formatted: Comment[] = (data || []).map((c: any) => ({
        id: c.id,
        lessonId: c.lesson_id,
        userName: c.user_name,
        message: c.message,
        imageUrl: c.image_url || null,
        createdAt: c.created_at,
      }));

      setComments(formatted);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const createComment = useCallback(async (input: CommentInput, userName?: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to comment");
      return false;
    }

    try {
      const { error: dbError } = await supabase.from("comments").insert({
        lesson_id: input.lessonId,
        user_name: userName || profile?.fullName || "Anonymous",
        message: input.message,
        image_url: input.imageUrl || null,
        user_id: user.id,
      } as any);

      if (dbError) throw dbError;

      toast.success("Comment posted!");
      await fetchComments();
      return true;
    } catch (err: any) {
      console.error("Error creating comment:", err);
      toast.error(err.message || "Failed to post comment");
      return false;
    }
  }, [user, profile, fetchComments]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to delete comments");
      return false;
    }

    try {
      const { error: dbError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (dbError) throw dbError;

      toast.success("Comment deleted!");
      await fetchComments();
      return true;
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      toast.error(err.message || "Failed to delete comment");
      return false;
    }
  }, [user, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`comments-${lessonId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `lesson_id=eq.${lessonId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    deleteComment,
  };
};
