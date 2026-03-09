/**
 * useEnrollments Hook
 * ====================
 * Type-safe React Query hook for enrollments
 * Respects RLS - users can only see their own enrollments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Enrollment, EnrollmentInsert, EnrollmentWithCourse } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = ['enrollments'];

/**
 * Fetch user's enrollments with course details
 */
export function useEnrollments(userId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    queryFn: async (): Promise<EnrollmentWithCourse[]> => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EnrollmentWithCourse[];
    },
    enabled: !!userId,
  });
}

/**
 * Get enrolled course IDs for quick lookup
 */
export function useEnrolledCourseIds(userId?: string) {
  const { data: enrollments } = useEnrollments(userId);
  
  return (enrollments || [])
    .filter((e) => e.status === 'active')
    .map((e) => e.course_id);
}

/**
 * Check if user is enrolled in specific course
 */
export function useIsEnrolled(courseId: number, userId?: string) {
  return useQuery({
    queryKey: ['enrollment', 'check', courseId, userId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!courseId,
  });
}

/**
 * Enroll in a course (typically after payment)
 */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      courseId 
    }: { 
      userId: string; 
      courseId: number;
    }): Promise<Enrollment> => {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing) {
        throw new Error('Already enrolled in this course');
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Successfully enrolled in course!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error((err as Error).message);
    },
  });
}

/**
 * Admin: Get all enrollments
 */
export function useAllEnrollments() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'admin'],
    queryFn: async (): Promise<EnrollmentWithCourse[]> => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EnrollmentWithCourse[];
    },
  });
}
