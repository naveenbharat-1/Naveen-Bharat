import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoEnrollResult {
  success: boolean;
  enrolledCourseIds: number[];
  error?: string;
}

export const useAutoEnrollment = () => {
  const enrollInFreeCourses = useCallback(async (userId: string): Promise<AutoEnrollResult> => {
    try {
      const { data: allCourses } = await supabase
        .from("courses")
        .select("id, price");

      const freeCourses = (allCourses || []).filter(
        (c: any) => c.price === 0 || c.price === null
      );

      if (freeCourses.length === 0) {
        return { success: true, enrolledCourseIds: [] };
      }

      const { data: existingEnrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", userId);

      const existingCourseIds = new Set(
        (existingEnrollments || []).map((e: any) => e.course_id)
      );

      const coursesToEnroll = freeCourses.filter(
        (course: any) => !existingCourseIds.has(course.id)
      );

      if (coursesToEnroll.length === 0) {
        return { success: true, enrolledCourseIds: [] };
      }

      const enrolledIds: number[] = [];
      for (const course of coursesToEnroll) {
        try {
          // Use upsert with ignoreDuplicates to prevent duplicates at DB level
          const { error } = await supabase.from("enrollments").upsert(
            { user_id: userId, course_id: course.id, status: 'active' },
            { onConflict: 'user_id,course_id', ignoreDuplicates: true }
          );
          if (!error) enrolledIds.push(course.id);
        } catch (err) {
          console.error(`Failed to enroll in course ${course.id}:`, err);
        }
      }

      console.log(`Auto-enrolled user in ${enrolledIds.length} free courses`);

      return {
        success: true,
        enrolledCourseIds: enrolledIds,
      };
    } catch (error: any) {
      console.error("Auto-enrollment error:", error);
      return {
        success: false,
        enrolledCourseIds: [],
        error: error.message,
      };
    }
  }, []);

  const getFirstEnrolledCourse = useCallback(async (userId: string): Promise<number | null> => {
    try {
      const { data } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      return data?.course_id ?? null;
    } catch (error) {
      console.error("Error getting enrolled course:", error);
      return null;
    }
  }, []);

  const isEnrolledInCourse = useCallback(async (userId: string, courseId: number): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error("Error checking enrollment:", error);
      return false;
    }
  }, []);

  return {
    enrollInFreeCourses,
    getFirstEnrolledCourse,
    isEnrolledInCourse,
  };
};
