export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: number
          status: string
          student_id: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: number
          status: string
          student_id: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: number
          status?: string
          student_id?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          record_count: number | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          record_count?: number | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          record_count?: number | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          amazon_url: string
          author: string
          click_count: number | null
          cover_url: string
          created_at: string
          description: string
          genre: string | null
          id: string
          position: number | null
          title: string
          updated_at: string
        }
        Insert: {
          amazon_url: string
          author: string
          click_count?: number | null
          cover_url: string
          created_at?: string
          description: string
          genre?: string | null
          id?: string
          position?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          amazon_url?: string
          author?: string
          click_count?: number | null
          cover_url?: string
          created_at?: string
          description?: string
          genre?: string | null
          id?: string
          position?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          code: string
          course_id: number
          created_at: string
          description: string | null
          id: string
          parent_id: string | null
          position: number
          title: string
        }
        Insert: {
          code: string
          course_id: number
          created_at?: string
          description?: string | null
          id?: string
          parent_id?: string | null
          position?: number
          title: string
        }
        Update: {
          code?: string
          course_id?: number
          created_at?: string
          description?: string | null
          id?: string
          parent_id?: string | null
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbot_feedback: {
        Row: {
          created_at: string
          id: string
          message_content: string | null
          rating: number | null
          response_content: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_content?: string | null
          rating?: number | null
          response_content?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string | null
          rating?: number | null
          response_content?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string
          response: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          response: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          response?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          enable_mock_help: boolean | null
          id: number
          max_tokens: number | null
          model: string | null
          provider: string | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          enable_mock_help?: boolean | null
          id?: number
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          enable_mock_help?: boolean | null
          id?: number
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          lesson_id: string | null
          message: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          message: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          message?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          grade: string | null
          id: number
          image_url: string | null
          price: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade?: string | null
          id?: number
          image_url?: string | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade?: string | null
          id?: number
          image_url?: string | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      crawl_history: {
        Row: {
          content_preview: string | null
          crawled_at: string
          crawled_by: string | null
          error_message: string | null
          id: string
          knowledge_entries_created: number
          status: string
          title: string | null
          url: string
        }
        Insert: {
          content_preview?: string | null
          crawled_at?: string
          crawled_by?: string | null
          error_message?: string | null
          id?: string
          knowledge_entries_created?: number
          status?: string
          title?: string | null
          url: string
        }
        Update: {
          content_preview?: string | null
          crawled_at?: string
          crawled_by?: string | null
          error_message?: string | null
          id?: string
          knowledge_entries_created?: number
          status?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawl_history_crawled_by_fkey"
            columns: ["crawled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawl_history_crawled_by_fkey"
            columns: ["crawled_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_sessions: {
        Row: {
          course_id: number | null
          created_at: string
          description: string
          id: string
          scheduled_at: string | null
          status: string
          student_id: string
          subject: string | null
          teacher_id: string | null
          updated_at: string
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_meeting_number: string | null
          zoom_password: string | null
        }
        Insert: {
          course_id?: number | null
          created_at?: string
          description: string
          id?: string
          scheduled_at?: string | null
          status?: string
          student_id: string
          subject?: string | null
          teacher_id?: string | null
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_meeting_number?: string | null
          zoom_password?: string | null
        }
        Update: {
          course_id?: number | null
          created_at?: string
          description?: string
          id?: string
          scheduled_at?: string | null
          status?: string
          student_id?: string
          subject?: string | null
          teacher_id?: string | null
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_meeting_number?: string | null
          zoom_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doubt_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: number
          id: number
          last_watched_lesson_id: string | null
          progress_percentage: number | null
          purchased_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          course_id: number
          id?: number
          last_watched_lesson_id?: string | null
          progress_percentage?: number | null
          purchased_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          course_id?: number
          id?: number
          last_watched_lesson_id?: string | null
          progress_percentage?: number | null
          purchased_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_last_watched_lesson_id_fkey"
            columns: ["last_watched_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          badge_text: string | null
          bg_color: string
          created_at: string
          cta_link: string
          cta_text: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          position: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          bg_color?: string
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          bg_color?: string
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          position: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          position?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          position?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          content: Json | null
          section_key: string
        }
        Insert: {
          content?: Json | null
          section_key: string
        }
        Update: {
          content?: Json | null
          section_key?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          grade: string
          id: number
          student_name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          grade: string
          id?: number
          student_name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          grade?: string
          id?: number
          student_name?: string
        }
        Relationships: []
      }
      lecture_notes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          markdown: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          markdown?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          markdown?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_schedules: {
        Row: {
          chapter_id: string | null
          course_id: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          scheduled_date: string
          scheduled_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          scheduled_date: string
          scheduled_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          scheduled_date?: string
          scheduled_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_schedules_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_likes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_likes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          category: string | null
          chapter_id: string | null
          class_pdf_url: string | null
          course_id: number | null
          created_at: string | null
          description: string | null
          duration: number | null
          file_path: string | null
          id: string
          is_locked: boolean | null
          lecture_type: string | null
          like_count: number | null
          overview: string | null
          position: number | null
          thumbnail_url: string | null
          title: string
          video_url: string
          youtube_id: string | null
        }
        Insert: {
          category?: string | null
          chapter_id?: string | null
          class_pdf_url?: string | null
          course_id?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_path?: string | null
          id?: string
          is_locked?: boolean | null
          lecture_type?: string | null
          like_count?: number | null
          overview?: string | null
          position?: number | null
          thumbnail_url?: string | null
          title: string
          video_url: string
          youtube_id?: string | null
        }
        Update: {
          category?: string | null
          chapter_id?: string | null
          class_pdf_url?: string | null
          course_id?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_path?: string | null
          id?: string
          is_locked?: boolean | null
          lecture_type?: string | null
          like_count?: number | null
          overview?: string | null
          position?: number | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_messages: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          message: string
          session_id: string
          type: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          message: string
          session_id: string
          type?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          message?: string
          session_id?: string
          type?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_participants: {
        Row: {
          hand_raised: boolean
          id: string
          joined_at: string
          session_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          hand_raised?: boolean
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
          user_name: string
        }
        Update: {
          hand_raised?: boolean
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          recording_url: string | null
          scheduled_at: string | null
          started_at: string | null
          title: string
          youtube_live_id: string
        }
        Insert: {
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          recording_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          title: string
          youtube_live_id: string
        }
        Update: {
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          recording_url?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          title?: string
          youtube_live_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          course_id: number | null
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          course_id?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lesson_id?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string | null
          pdf_url: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pdf_url: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pdf_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          pdf_url: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          pdf_url?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          pdf_url?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number | null
          course_id: number | null
          created_at: string | null
          id: number
          screenshot_url: string | null
          sender_name: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number | null
          course_id?: number | null
          created_at?: string | null
          id?: number
          screenshot_url?: string | null
          sender_name?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number | null
          course_id?: number | null
          created_at?: string | null
          id?: number
          screenshot_url?: string | null
          sender_name?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          mobile?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          image_url: string | null
          marks: number | null
          negative_marks: number | null
          options: Json | null
          order_index: number | null
          question_text: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          question_text: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          question_text?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string
          passed: boolean | null
          percentage: number | null
          quiz_id: string
          score: number | null
          started_at: string | null
          submitted_at: string | null
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          chapter_id: string | null
          course_id: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          lesson_id: string | null
          pass_percentage: number | null
          title: string
          total_marks: number | null
          type: string | null
        }
        Insert: {
          chapter_id?: string | null
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          pass_percentage?: number | null
          title: string
          total_marks?: number | null
          type?: string | null
        }
        Update: {
          chapter_id?: string | null
          course_id?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          pass_percentage?: number | null
          title?: string
          total_marks?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      razorpay_payments: {
        Row: {
          amount: number
          course_id: number
          created_at: string | null
          currency: string | null
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          course_id: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          id: number
          stat_key: string
          stat_value: string
        }
        Insert: {
          id?: number
          stat_key: string
          stat_value: string
        }
        Update: {
          id?: number
          stat_key?: string
          stat_value?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          grade: number
          id: number
          name: string
          roll_number: string
          section: string
        }
        Insert: {
          created_at?: string
          grade: number
          id?: number
          name: string
          roll_number: string
          section: string
        }
        Update: {
          created_at?: string
          grade?: number
          id?: number
          name?: string
          roll_number?: string
          section?: string
        }
        Relationships: []
      }
      syllabus: {
        Row: {
          course_id: number
          created_at: string
          description: string | null
          id: string
          title: string
          topics: string[] | null
          week_number: number | null
        }
        Insert: {
          course_id: number
          created_at?: string
          description?: string | null
          id?: string
          title: string
          topics?: string[] | null
          week_number?: number | null
        }
        Update: {
          course_id?: number
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          topics?: string[] | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable: {
        Row: {
          course_id: number | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
          teacher_id: string | null
        }
        Insert: {
          course_id?: number | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          teacher_id?: string | null
        }
        Update: {
          course_id?: number | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean | null
          course_id: number
          created_at: string | null
          id: string
          last_watched_at: string | null
          lesson_id: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          course_id: number
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          course_id?: number
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_type: string
          expires_at: string
          id: string
          is_active: boolean
          last_active_at: string
          logged_in_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_type?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_active_at?: string
          logged_in_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_type?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_active_at?: string
          logged_in_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      questions_for_students: {
        Row: {
          id: string | null
          image_url: string | null
          marks: number | null
          negative_marks: number | null
          options: Json | null
          order_index: number | null
          question_text: string | null
          question_type: string | null
          quiz_id: string | null
        }
        Insert: {
          id?: string | null
          image_url?: string | null
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          question_text?: string | null
          question_type?: string | null
          quiz_id?: string | null
        }
        Update: {
          id?: string | null
          image_url?: string | null
          marks?: number | null
          negative_marks?: number | null
          options?: Json | null
          order_index?: number | null
          question_text?: string | null
          question_type?: string | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_profiles_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          mobile: string
          role: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_book_clicks: { Args: { book_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      lecture_type: "VIDEO" | "PDF" | "DPP" | "NOTES"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      lecture_type: ["VIDEO", "PDF", "DPP", "NOTES"],
    },
  },
} as const
