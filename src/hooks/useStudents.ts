import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Student {
  id: number;
  name: string;
  rollNumber: string;
  grade: number;
  section: string;
  createdAt: string;
}

export interface StudentInput {
  name: string;
  rollNumber: string;
  grade: number;
  section: string;
}

export const useStudents = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from("students")
        .select("*")
        .order("name", { ascending: true });

      if (dbError) throw dbError;

      const formatted: Student[] = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.roll_number,
        grade: s.grade,
        section: s.section,
        createdAt: s.created_at,
      }));

      setStudents(formatted);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentsByGrade = useCallback(async (grade: number): Promise<Student[]> => {
    try {
      const { data, error: dbError } = await supabase
        .from("students")
        .select("*")
        .eq("grade", grade)
        .order("name", { ascending: true });

      if (dbError) throw dbError;

      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.roll_number,
        grade: s.grade,
        section: s.section,
        createdAt: s.created_at,
      }));
    } catch (err: any) {
      console.error("Error fetching students by grade:", err);
      return [];
    }
  }, []);

  const createStudent = useCallback(async (input: StudentInput): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      const { error: dbError } = await supabase.from("students").insert({
        name: input.name,
        roll_number: input.rollNumber,
        grade: input.grade,
        section: input.section,
      });

      if (dbError) throw dbError;

      toast.success("Student added successfully!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error creating student:", err);
      toast.error(err.message || "Failed to add student");
      return false;
    }
  }, [isAdmin, isTeacher, fetchStudents]);

  const updateStudent = useCallback(async (id: number, input: Partial<StudentInput>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.rollNumber !== undefined) updateData.roll_number = input.rollNumber;
      if (input.grade !== undefined) updateData.grade = input.grade;
      if (input.section !== undefined) updateData.section = input.section;

      const { error: dbError } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Student updated!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error updating student:", err);
      toast.error(err.message || "Failed to update");
      return false;
    }
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error: dbError } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Student deleted!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error deleting student:", err);
      toast.error(err.message || "Failed to delete");
      return false;
    }
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    fetchStudents,
    fetchStudentsByGrade,
    createStudent,
    updateStudent,
    deleteStudent,
  };
};
