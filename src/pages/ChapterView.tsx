import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { Breadcrumbs, ChapterCard } from "@/components/course";
import { useAuth } from "@/contexts/AuthContext";

interface Chapter {
  id: string;
  code: string;
  title: string;
  description: string | null;
  position: number;
  lessonCount: number;
  completedLessons: number;
}

interface Course {
  id: number;
  title: string;
  grade: string | null;
}

const ChapterView = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chapters" | "material">("chapters");

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        // Fetch course from Supabase
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, title, grade")
          .eq("id", Number(courseId))
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch chapters from Supabase (only top-level)
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select("id, code, title, description, position")
          .eq("course_id", Number(courseId))
          .is("parent_id", null)
          .order("position", { ascending: true });

        // Fetch sub-chapters to aggregate lesson counts
        const { data: subChaptersData } = await supabase
          .from("chapters")
          .select("id, parent_id")
          .eq("course_id", Number(courseId))
          .not("parent_id", "is", null);

        if (chaptersError) throw chaptersError;

        // Fetch lesson counts grouped by chapter_id
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, chapter_id")
          .eq("course_id", Number(courseId));

        const lessonCountMap: Record<string, number> = {};
        let totalLessons = 0;
        (lessonsData || []).forEach((l) => {
          totalLessons++;
          if (l.chapter_id) {
            lessonCountMap[l.chapter_id] = (lessonCountMap[l.chapter_id] || 0) + 1;
          }
        });

        // Fetch completed lessons for current user
        const completedMap: Record<string, number> = {};
        let totalCompleted = 0;
        if (user?.id) {
          const { data: progressData } = await supabase
            .from("user_progress")
            .select("lesson_id")
            .eq("user_id", user.id)
            .eq("course_id", Number(courseId))
            .eq("completed", true);

          const completedLessonIds = new Set((progressData || []).map(p => p.lesson_id));
          totalCompleted = completedLessonIds.size;

          // Map completed counts per chapter
          (lessonsData || []).forEach((l) => {
            if (completedLessonIds.has(l.id) && l.chapter_id) {
              completedMap[l.chapter_id] = (completedMap[l.chapter_id] || 0) + 1;
            }
          });
        }

        const allContentChapter: Chapter = {
          id: "__all__",
          code: "ALL",
          title: "All Content",
          description: "All lectures and materials for this course",
          position: -1,
          lessonCount: totalLessons,
          completedLessons: totalCompleted,
        };

        // Build parent -> sub-chapter ID mapping
        const subChaptersByParent: Record<string, string[]> = {};
        (subChaptersData || []).forEach(sc => {
          if (sc.parent_id) {
            if (!subChaptersByParent[sc.parent_id]) subChaptersByParent[sc.parent_id] = [];
            subChaptersByParent[sc.parent_id].push(sc.id);
          }
        });

        const mappedChapters: Chapter[] = (chaptersData || []).map((ch: any) => {
          // Aggregate: parent lessons + sub-chapter lessons
          const subIds = subChaptersByParent[ch.id] || [];
          const totalLessonCount = (lessonCountMap[ch.id] || 0) + subIds.reduce((sum, sid) => sum + (lessonCountMap[sid] || 0), 0);
          const totalCompleted = (completedMap[ch.id] || 0) + subIds.reduce((sum, sid) => sum + (completedMap[sid] || 0), 0);
          return {
            id: ch.id,
            code: ch.code,
            title: ch.title,
            description: ch.description,
            position: ch.position,
            lessonCount: totalLessonCount,
            completedLessons: totalCompleted,
          };
        });

        setChapters([allContentChapter, ...mappedChapters]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user?.id]);

  if (loading) {
    return <LoadingSpinner fullPage size="lg" text="Loading subjects..." />;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const breadcrumbSegments = [
    { label: "All Classes", href: "/all-classes" },
    { label: course.title },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-6 pb-3 sticky top-0 z-20 bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/all-classes")}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{course.title}</h1>
        </div>
      </header>

      <Breadcrumbs segments={breadcrumbSegments} className="sticky top-[60px] z-10" />

      <div className="flex gap-6 px-5 border-b border-border">
        <button
          onClick={() => setActiveTab("chapters")}
          className={cn(
            "pb-3 text-base font-medium relative transition-colors",
            activeTab === "chapters" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Subjects
          {activeTab === "chapters" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("material")}
          className={cn(
            "pb-3 text-base font-medium relative transition-colors",
            activeTab === "material" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Study Material
          {activeTab === "material" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {activeTab === "chapters" &&
          chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              code={chapter.code}
              title={chapter.title}
              lectureCount={chapter.lessonCount}
              completedLectures={chapter.completedLessons}
              onClick={() => {
                if (chapter.id === "__all__") {
                  navigate(`/classes/${courseId}/chapter/__all__`);
                } else {
                  navigate(`/classes/${courseId}/chapter/${chapter.id}`);
                }
              }}
            />
          ))}

        {activeTab === "material" && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No study material available yet.</p>
          </div>
        )}

        {activeTab === "chapters" && chapters.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No subjects available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterView;
