import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import MahimaVideoPlayer from "@/components/video/MahimaVideoPlayer";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  description: string | null;
  course_id: number | null;
  is_locked: boolean | null;
}

interface Course {
  id: number;
  title: string;
}

interface Note {
  id: string;
  title: string;
  pdf_url: string;
}

interface Material {
  id: string;
  title: string;
  file_url: string;
  file_type?: string;
}

const Lesson = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { state: { from: `/lesson/${id}` } });
      return;
    }
  }, [authLoading, isAuthenticated, navigate, id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      try {
        // Fetch lesson
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", id)
          .single();
        
        if (lessonError || !lessonData) {
          navigate("/dashboard");
          return;
        }
        setLesson(lessonData);

        // Fetch course
        if (lessonData.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("id, title")
            .eq("id", lessonData.course_id)
            .single();
          setCourse(courseData);

          // Check enrollment
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", String(user.id))
            .eq("course_id", lessonData.course_id)
            .single();
          
          const enrolled = !!enrollment;
          setIsEnrolled(enrolled);

          // If lesson is locked and user is not enrolled, redirect
          if (lessonData.is_locked && !enrolled) {
            navigate(`/course/${lessonData.course_id}`);
            return;
          }
        }

        // Fetch notes for this lesson
        const { data: notesData } = await supabase
          .from("notes")
          .select("id, title, pdf_url")
          .eq("lesson_id", id);
        setNotes(notesData || []);

        // Fetch materials for this lesson
        const { data: materialsData } = await supabase
          .from("materials")
          .select("id, title, file_url, type")
          .eq("course_id", lessonData?.course_id || 0);
        setMaterials((materialsData || []) as unknown as Material[]);

      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [id, user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Lesson not found.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Breadcrumb Header */}
      <div className="bg-primary px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => course ? navigate(`/course/${course.id}`) : navigate(-1)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          {course && (
            <p className="text-xs text-primary-foreground/70">{course.title}</p>
          )}
          <h1 className="text-lg font-semibold text-primary-foreground">{lesson.title}</h1>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Video Player - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <MahimaVideoPlayer
              videoUrl={lesson.video_url}
              onEnded={() => console.log('Video completed')}
            />
            
            {lesson.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this Lesson</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{lesson.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Notes & Materials */}
          <div className="lg:col-span-1 space-y-4">
            {/* Notes */}
            {notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lesson Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notes.map((note) => (
                    <a
                      key={note.id}
                      href={note.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{note.title}</span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Study Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {materials.map((material) => (
                    <a
                      key={material.id}
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{material.title}</p>
                        <p className="text-xs text-muted-foreground">{material.file_type}</p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {notes.length === 0 && materials.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional materials for this lesson.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lesson;
