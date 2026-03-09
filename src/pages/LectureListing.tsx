import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, PackageOpen, FolderOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs, LectureCard, LectureModal } from "@/components/course";
import { ContentViewSwitcher, type ViewMode } from "@/components/course/ContentViewSwitcher";
import { LectureGalleryCard } from "@/components/course/LectureGalleryCard";
import { LectureTableView } from "@/components/course/LectureTableView";
import { ViewSkeletons } from "@/components/course/ViewSkeletons";
import { toast } from "sonner";
import doubtsIcon from "@/assets/icons/doubts-3d.png";

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  description: string | null;
  is_locked: boolean | null;
  lecture_type: string;
  position: number;
  youtube_id: string | null;
  duration: number | null;
  created_at: string | null;
}

interface Chapter {
  id: string;
  code: string;
  title: string;
  course_id: number;
  parent_id: string | null;
}

interface SubChapter {
  id: string;
  code: string;
  title: string;
  position: number;
  lessonCount: number;
}

interface Course {
  id: number;
  title: string;
  grade: string | null;
}

type TabType = "all" | "lectures" | "pdfs" | "dpps" | "notes" | "tests";

const LectureListing = () => {
  const navigate = useNavigate();
  const { courseId, chapterId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [parentChapter, setParentChapter] = useState<Chapter | null>(null);
  const [subChapters, setSubChapters] = useState<SubChapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showSubChapters, setShowSubChapters] = useState(false);
  const [lessonQuizMap, setLessonQuizMap] = useState<Record<string, string>>({});

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const isModalOpen = searchParams.get("lecture") !== null;
  const { isAdmin, isTeacher } = useAuth();
  const isAdminOrTeacher = isAdmin || isTeacher;

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      try {
        const { data: courseData, error: courseError } = await supabase
          .from("courses").select("id, title, grade").eq("id", Number(courseId)).single();
        if (courseError) throw courseError;
        setCourse(courseData);

        if (user) {
          const { data: enrollment } = await supabase.from("enrollments").select("*")
            .eq("user_id", String(user.id)).eq("course_id", Number(courseId)).eq("status", "active").maybeSingle();
          if (enrollment) setHasPurchased(true);
        }

        if (chapterId && chapterId !== "__all__") {
          const { data: chapterData, error: chapterError } = await supabase
            .from("chapters").select("id, code, title, course_id, parent_id").eq("id", chapterId).single();
          if (!chapterError && chapterData) {
            setChapter(chapterData);

            // If this chapter has a parent, fetch parent for breadcrumbs
            if (chapterData.parent_id) {
              const { data: parentData } = await supabase
                .from("chapters").select("id, code, title, course_id, parent_id").eq("id", chapterData.parent_id).single();
              if (parentData) setParentChapter(parentData);
            }

            // Check for sub-chapters
            const { data: subChaptersData } = await supabase
              .from("chapters").select("id, code, title, position")
              .eq("parent_id", chapterId)
              .order("position", { ascending: true });

            if (subChaptersData && subChaptersData.length > 0) {
              // Fetch lesson counts AND full lesson data for sub-chapters
              const subIds = subChaptersData.map(sc => sc.id);
              const [{ data: subLessonsCountData }, { data: subLessonsFullData }] = await Promise.all([
                supabase.from("lessons").select("id, chapter_id").in("chapter_id", subIds),
                supabase.from("lessons").select("*").in("chapter_id", subIds).order("position", { ascending: true }),
              ]);

              const countMap: Record<string, number> = {};
              (subLessonsCountData || []).forEach(l => {
                if (l.chapter_id) countMap[l.chapter_id] = (countMap[l.chapter_id] || 0) + 1;
              });

              setSubChapters(subChaptersData.map(sc => ({
                ...sc,
                lessonCount: countMap[sc.id] || 0,
              })));
              setShowSubChapters(true);

              // Fetch direct lessons for this chapter AND combine with sub-chapter lessons
              const { data: directLessonsData } = await supabase
                .from("lessons").select("*").eq("chapter_id", chapterId).order("position", { ascending: true });

              const combined = [
                ...(directLessonsData || []),
                ...(subLessonsFullData || []),
              ];
              setLessons(combined.map((l: any, idx: number) => ({
                ...l, lecture_type: l.lecture_type || "VIDEO", position: l.position || idx + 1,
              })));
            } else {
              setShowSubChapters(false);

              // Fetch lessons for this chapter (direct lessons only)
              const { data: lessonsData, error: lessonsError } = await supabase
                .from("lessons").select("*").eq("chapter_id", chapterId).order("position", { ascending: true });
              if (!lessonsError) {
                setLessons((lessonsData || []).map((l: any, idx: number) => ({
                  ...l, lecture_type: l.lecture_type || "VIDEO", position: l.position || idx + 1,
                })));
              }
            }
          }
        } else {
          // No chapter or __all__ — fetch all lessons for this course
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("lessons").select("*").eq("course_id", Number(courseId)).order("created_at", { ascending: true });
          if (!lessonsError) {
            setLessons((lessonsData || []).map((l: any, idx: number) => ({
              ...l, lecture_type: l.lecture_type || "VIDEO", position: l.position || idx + 1,
            })));
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, chapterId, user]);

  // Fetch quizzes linked to lessons (DPP/TEST)
  useEffect(() => {
    if (lessons.length === 0) return;
    const lessonIds = lessons
      .filter(l => l.lecture_type === "DPP" || l.lecture_type === "TEST")
      .map(l => l.id);
    if (lessonIds.length === 0) return;
    supabase
      .from("quizzes")
      .select("id, lesson_id")
      .in("lesson_id", lessonIds)
      .eq("is_published", true)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((q: any) => { if (q.lesson_id) map[q.lesson_id] = q.id; });
          setLessonQuizMap(map);
        }
      });
  }, [lessons]);

  const handleLectureClick = (lesson: Lesson) => {
    if (lesson.is_locked && !hasPurchased && !isAdminOrTeacher) {
      toast.error("This lecture is locked. Please purchase the course.");
      navigate(`/buy-course?id=${courseId}`);
      return;
    }
    setSelectedLesson(lesson);
    setSearchParams({ lecture: lesson.id });
  };

  const handleModalClose = () => {
    setSelectedLesson(null);
    setSearchParams({});
  };

  const filteredLessons = lessons.filter((l) => {
    if (activeTab === "all") return true;
    if (activeTab === "lectures") return l.lecture_type === "VIDEO";
    if (activeTab === "pdfs") return l.lecture_type === "PDF";
    if (activeTab === "dpps") return l.lecture_type === "DPP";
    if (activeTab === "notes") return l.lecture_type === "NOTES";
    if (activeTab === "tests") return l.lecture_type === "TEST";
    return true;
  });

  const tabCounts = {
    all: lessons.length,
    lectures: lessons.filter(l => l.lecture_type === "VIDEO").length,
    pdfs: lessons.filter(l => l.lecture_type === "PDF").length,
    dpps: lessons.filter(l => l.lecture_type === "DPP").length,
    notes: lessons.filter(l => l.lecture_type === "NOTES").length,
    tests: lessons.filter(l => l.lecture_type === "TEST").length,
  };

  if (!loading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  // Build breadcrumbs with sub-chapter support
  const breadcrumbSegments = course ? [
    { label: "All Classes", href: "/all-classes" },
    { label: course.title, href: `/classes/${courseId}/chapters` },
    ...(parentChapter ? [
      { label: `${parentChapter.code} : ${parentChapter.title}`, href: `/classes/${courseId}/chapter/${parentChapter.id}` },
    ] : []),
    ...(chapter ? [
      { label: `${chapter.code} : ${chapter.title}` },
    ] : []),
  ] : [];

  const pageTitle = chapter ? `${chapter.code} : ${chapter.title}` : course?.title || "";

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: tabCounts.all },
    { id: "lectures", label: "Lectures", count: tabCounts.lectures },
    { id: "pdfs", label: "PDFs", count: tabCounts.pdfs },
    { id: "dpps", label: "DPPs", count: tabCounts.dpps },
    { id: "notes", label: "Notes", count: tabCounts.notes },
    { id: "tests", label: "Tests", count: tabCounts.tests },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-3 sticky top-0 z-20 bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (parentChapter) {
                navigate(`/classes/${courseId}/chapter/${parentChapter.id}`);
              } else if (chapter) {
                navigate(`/classes/${courseId}/chapters`);
              } else {
                navigate("/all-classes");
              }
            }}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground line-clamp-1 flex-1">{pageTitle}</h1>
          <ContentViewSwitcher activeView={viewMode} onViewChange={setViewMode} />
        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbSegments} className="sticky top-[60px] z-10" />

      {/* Sub-chapters section */}
      {showSubChapters && subChapters.length > 0 && (
        <div className="px-5 py-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Sub-folders</h3>
          <div className="space-y-2">
            {subChapters.map((sc) => (
              <button
                key={sc.id}
                onClick={() => navigate(`/classes/${courseId}/chapter/${sc.id}`)}
                className="w-full p-3 border rounded-xl bg-card hover:border-primary hover:shadow-sm transition-all text-left group flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sc.code} : {sc.title}</p>
                  <p className="text-xs text-muted-foreground">{sc.lessonCount} lectures</p>
                </div>
              </button>
            ))}
          </div>
          {lessons.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Direct Lectures</h3>
            </div>
          )}
        </div>
      )}

      {/* Tab Bar (only show if there are direct lessons) */}
      {(!showSubChapters || lessons.length > 0) && (
        <div className="flex gap-3 px-5 py-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {(!showSubChapters || lessons.length > 0) && (
        <div className="p-5">
          {loading ? (
            <ViewSkeletons view={viewMode} />
          ) : filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <img src={doubtsIcon} alt="Empty" width={64} height={64} className="w-16 h-16 object-contain mb-4 opacity-60" />
              <p className="text-muted-foreground font-medium">No content found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try switching tabs or check back later.</p>
            </div>
          ) : (
            <div className={cn(
              "transition-opacity duration-200",
              "animate-in fade-in-0 duration-200"
            )}>
              {viewMode === "list" && (
                <div className="space-y-4">
                  {filteredLessons.map((lesson) => {
                    const linkedQuizId = lessonQuizMap[lesson.id];
                    const isDppOrTest = lesson.lecture_type === "DPP" || lesson.lecture_type === "TEST";
                    return (
                      <div key={lesson.id} className="relative">
                        <LectureCard
                          id={lesson.id}
                          title={lesson.title}
                          lectureType={lesson.lecture_type as "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST"}
                          position={lesson.position}
                          duration={lesson.duration}
                          createdAt={lesson.created_at}
                          isLocked={!!lesson.is_locked && !hasPurchased && !isAdminOrTeacher}
                          onClick={() => handleLectureClick(lesson)}
                        />
                        {isDppOrTest && linkedQuizId && (
                          <div className="mt-1 px-1">
                            <button
                              onClick={() => navigate(`/quiz/${linkedQuizId}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors"
                            >
                              <ClipboardList className="h-3.5 w-3.5" />
                              {lesson.lecture_type === "TEST" ? "Take Test" : "Attempt DPP"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {viewMode === "gallery" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredLessons.map((lesson) => (
                    <LectureGalleryCard
                      key={lesson.id}
                      id={lesson.id}
                      title={lesson.title}
                      lectureType={lesson.lecture_type as "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST"}
                      duration={lesson.duration}
                      createdAt={lesson.created_at}
                      isLocked={!!lesson.is_locked && !hasPurchased && !isAdminOrTeacher}
                      quizId={lessonQuizMap[lesson.id]}
                      onClick={() => handleLectureClick(lesson)}
                    />
                  ))}
                </div>
              )}

              {viewMode === "table" && (
                <LectureTableView
                  lessons={filteredLessons}
                  hasPurchased={hasPurchased}
                  isAdminOrTeacher={isAdminOrTeacher}
                  onLectureClick={handleLectureClick}
                  lessonQuizMap={lessonQuizMap}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Lecture Modal */}
      <LectureModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        lesson={selectedLesson}
        userId={user?.id != null ? String(user.id) : undefined}
      />
    </div>
  );
};

export default LectureListing;
