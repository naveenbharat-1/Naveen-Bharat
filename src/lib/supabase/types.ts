/**
 * Supabase Type Helpers
 * =====================
 * Type-safe helpers for working with Supabase data
 */

import type { Database } from '@/integrations/supabase/types';

// Table row types
export type Tables = Database['public']['Tables'];
export type Views = Database['public']['Views'];
export type Enums = Database['public']['Enums'];

// Specific table types
export type Course = Tables['courses']['Row'];
export type CourseInsert = Tables['courses']['Insert'];
export type CourseUpdate = Tables['courses']['Update'];

export type Lesson = Tables['lessons']['Row'];
export type LessonInsert = Tables['lessons']['Insert'];
export type LessonUpdate = Tables['lessons']['Update'];

export type Enrollment = Tables['enrollments']['Row'];
export type EnrollmentInsert = Tables['enrollments']['Insert'];
export type EnrollmentUpdate = Tables['enrollments']['Update'];

export type PaymentRequest = Tables['payment_requests']['Row'];
export type PaymentRequestInsert = Tables['payment_requests']['Insert'];
export type PaymentRequestUpdate = Tables['payment_requests']['Update'];

export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export type UserRole = Tables['user_roles']['Row'];
export type UserRoleInsert = Tables['user_roles']['Insert'];

export type Student = Tables['students']['Row'];
export type StudentInsert = Tables['students']['Insert'];
export type StudentUpdate = Tables['students']['Update'];

export type Attendance = Tables['attendance']['Row'];
export type AttendanceInsert = Tables['attendance']['Insert'];
export type AttendanceUpdate = Tables['attendance']['Update'];

export type Material = Tables['materials']['Row'];
export type MaterialInsert = Tables['materials']['Insert'];
export type MaterialUpdate = Tables['materials']['Update'];

export type Message = Tables['messages']['Row'];
export type MessageInsert = Tables['messages']['Insert'];
export type MessageUpdate = Tables['messages']['Update'];

export type Notice = Tables['notices']['Row'];
export type NoticeInsert = Tables['notices']['Insert'];
export type NoticeUpdate = Tables['notices']['Update'];

export type Comment = Tables['comments']['Row'];
export type CommentInsert = Tables['comments']['Insert'];
export type CommentUpdate = Tables['comments']['Update'];

export type Note = Tables['notes']['Row'];
export type NoteInsert = Tables['notes']['Insert'];
export type NoteUpdate = Tables['notes']['Update'];

export type Syllabus = Tables['syllabus']['Row'];
export type SyllabusInsert = Tables['syllabus']['Insert'];
export type SyllabusUpdate = Tables['syllabus']['Update'];

export type Timetable = Tables['timetable']['Row'];
export type TimetableInsert = Tables['timetable']['Insert'];
export type TimetableUpdate = Tables['timetable']['Update'];

export type Book = Tables['books']['Row'];
export type BookInsert = Tables['books']['Insert'];
export type BookUpdate = Tables['books']['Update'];

export type Lead = Tables['leads']['Row'];
export type LeadInsert = Tables['leads']['Insert'];

export type LandingContent = Tables['landing_content']['Row'];

export type SiteStat = Tables['site_stats']['Row'];

// Enum types
export type AppRole = Enums['app_role'];

// View types
export type ProfilePublic = Views['profiles_public']['Row'];

// Join types for common queries
export interface EnrollmentWithCourse extends Enrollment {
  courses: Course;
}

export interface PaymentWithDetails extends PaymentRequest {
  courses: Course | null;
  profiles: Pick<Profile, 'full_name' | 'email'> | null;
}

export interface LessonWithCourse extends Lesson {
  courses: Pick<Course, 'title' | 'grade'> | null;
}

export interface MaterialWithCourse extends Material {
  courses: Pick<Course, 'title' | 'grade'> | null;
}

export interface UserWithRole extends Profile {
  role: AppRole | null;
}
