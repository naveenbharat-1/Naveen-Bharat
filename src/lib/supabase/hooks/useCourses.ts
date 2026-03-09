/**
 * useCourses Hook
 * ================
 * Type-safe React Query hook for courses CRUD
 * Uses Supabase directly with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course, CourseInsert, CourseUpdate } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = ['courses'];

/**
 * Fetch all courses
 */
export function useCourses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetch single course by ID
 */
export function useCourse(id: number | null) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: async (): Promise<Course | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('courses')
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
 * Fetch courses by grade
 */
export function useCoursesByGrade(grade: string | null) {
  return useQuery({
    queryKey: ['courses', 'grade', grade],
    queryFn: async (): Promise<Course[]> => {
      if (!grade) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('grade', grade)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!grade,
  });
}

/**
 * Create course mutation with optimistic update
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CourseInsert): Promise<Course> => {
      const { data, error } = await supabase
        .from('courses')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newCourse) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Snapshot previous value
      const previousCourses = queryClient.getQueryData<Course[]>(QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData<Course[]>(QUERY_KEY, (old) => [
        { ...newCourse, id: Date.now(), created_at: new Date().toISOString() } as Course,
        ...(old || []),
      ]);

      return { previousCourses };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousCourses) {
        queryClient.setQueryData(QUERY_KEY, context.previousCourses);
      }
      toast.error('Failed to create course: ' + (err as Error).message);
    },
    onSuccess: () => {
      toast.success('Course created successfully!');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Update course mutation with optimistic update
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CourseUpdate & { id: number }): Promise<Course> => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousCourses = queryClient.getQueryData<Course[]>(QUERY_KEY);

      queryClient.setQueryData<Course[]>(QUERY_KEY, (old) =>
        old?.map((course) =>
          course.id === id ? { ...course, ...updates } : course
        )
      );

      return { previousCourses };
    },
    onError: (err, _, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(QUERY_KEY, context.previousCourses);
      }
      toast.error('Failed to update course: ' + (err as Error).message);
    },
    onSuccess: () => {
      toast.success('Course updated successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Delete course mutation with optimistic update
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousCourses = queryClient.getQueryData<Course[]>(QUERY_KEY);

      queryClient.setQueryData<Course[]>(QUERY_KEY, (old) =>
        old?.filter((course) => course.id !== id)
      );

      return { previousCourses };
    },
    onError: (err, _, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(QUERY_KEY, context.previousCourses);
      }
      toast.error('Failed to delete course: ' + (err as Error).message);
    },
    onSuccess: () => {
      toast.success('Course deleted successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
