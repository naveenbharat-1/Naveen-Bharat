/**
 * Supabase Hooks - Central Export
 * =================================
 * Type-safe React Query hooks for all Supabase operations
 */

// Auth
export { useSupabaseAuth } from './useAuth';

// Courses
export {
  useCourses,
  useCourse,
  useCoursesByGrade,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from './useCourses';

// Enrollments
export {
  useEnrollments,
  useEnrolledCourseIds,
  useIsEnrolled,
  useEnrollInCourse,
  useAllEnrollments,
} from './useEnrollments';

// Payments
export {
  usePayments,
  useUserPayments,
  useSubmitPayment,
  useApprovePayment,
  useRejectPayment,
  usePaymentStats,
} from './usePayments';

// Lessons
export {
  useLessons,
  useLesson,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useToggleLessonLock,
} from './useLessons';
