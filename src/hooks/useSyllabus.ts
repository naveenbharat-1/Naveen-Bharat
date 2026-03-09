import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Syllabus {
  id: string;
  courseId: number;
  title: string;
  description: string | null;
  weekNumber: number | null;
  topics: string[] | null;
  createdAt: string;
}

export interface SyllabusInput {
  courseId: number;
  title: string;
  description?: string;
  weekNumber?: number;
  topics?: string[];
}

export const useSyllabus = (courseId?: number) => {
  const { isAdmin, isTeacher } = useAuth();
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!courseId) {
        setSyllabus([]);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("syllabus")
        .select("*")
        .eq("course_id", courseId)
        .order("week_number", { ascending: true });

      if (dbError) throw dbError;

      const formatted: Syllabus[] = (data || []).map((s: any) => ({
        id: s.id,
        courseId: s.course_id,
        title: s.title,
        description: s.description,
        weekNumber: s.week_number,
        topics: s.topics,
        createdAt: s.created_at,
      }));

      setSyllabus(formatted);
    } catch (err: any) {
      console.error("Error fetching syllabus:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const createSyllabus = useCallback(async (input: SyllabusInput): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      const { error: dbError } = await supabase.from("syllabus").insert({
        course_id: input.courseId,
        title: input.title,
        description: input.description || null,
        week_number: input.weekNumber || null,
        topics: input.topics || null,
      });

      if (dbError) throw dbError;

      toast.success("Syllabus added!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error creating syllabus:", err);
      toast.error(err.message || "Failed to add syllabus");
      return false;
    }
  }, [isAdmin, isTeacher, fetchSyllabus]);

  const updateSyllabus = useCallback(async (id: string, input: Partial<SyllabusInput>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.weekNumber !== undefined) updateData.week_number = input.weekNumber;
      if (input.topics !== undefined) updateData.topics = input.topics;

      const { error: dbError } = await supabase
        .from("syllabus")
        .update(updateData)
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Syllabus updated!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error updating syllabus:", err);
      toast.error(err.message || "Failed to update");
      return false;
    }
  }, [fetchSyllabus]);

  const deleteSyllabus = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase
        .from("syllabus")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Syllabus deleted!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error deleting syllabus:", err);
      toast.error(err.message || "Failed to delete");
      return false;
    }
  }, [fetchSyllabus]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  return {
    syllabus,
    loading,
    error,
    fetchSyllabus,
    createSyllabus,
    updateSyllabus,
    deleteSyllabus,
  };
};
