/**
 * useLessons Hook
 * =================
 * Type-safe React Query hook for lessons CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Lesson, LessonInsert, LessonUpdate, LessonWithCourse } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = ['lessons'];

/**
 * Fetch lessons for a course
 */
export function useLessons(courseId?: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, courseId],
    queryFn: async (): Promise<LessonWithCourse[]> => {
      let query = supabase
        .from('lessons')
        .select(`
          *,
          courses (title, grade)
        `)
        .order('created_at', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LessonWithCourse[];
    },
  });
}

/**
 * Fetch single lesson
 */
export function useLesson(id?: string) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: async (): Promise<Lesson | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Create lesson (Admin/Teacher)
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LessonInsert): Promise<Lesson> => {
      const { data, error } = await supabase
        .from('lessons')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Lesson created!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      if (variables.course_id) {
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.course_id] });
      }
    },
    onError: (err) => {
      toast.error('Failed to create lesson: ' + (err as Error).message);
    },
  });
}

/**
 * Update lesson (Admin/Teacher)
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LessonUpdate & { id: string }): Promise<Lesson> => {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lesson updated!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to update lesson: ' + (err as Error).message);
    },
  });
}

/**
 * Delete lesson (Admin/Teacher)
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lesson deleted!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to delete lesson: ' + (err as Error).message);
    },
  });
}

/**
 * Toggle lesson lock status
 */
export function useToggleLessonLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }): Promise<Lesson> => {
      const { data, error } = await supabase
        .from('lessons')
        .update({ is_locked: isLocked })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.is_locked ? 'Lesson locked' : 'Lesson unlocked');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      toast.error('Failed to update lesson: ' + (err as Error).message);
    },
  });
}
