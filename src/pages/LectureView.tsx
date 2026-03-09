import { useState, useEffect, memo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Play, X, Check, Loader2, FileText, BookOpen, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/course/Breadcrumbs";
import PremiumVideoPlayer from "@/components/video/PremiumVideoPlayer";

const DriveEmbedViewer = lazy(() => import("@/components/course/DriveEmbedViewer"));
const SheetViewer = lazy(() => import("@/components/course/SheetViewer"));

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  isLocked: boolean;
  courseId: number;
  lectureType: string;
  position: number;
}

interface Course {
  id: number;
  title: string;
}

type TabFilter = "all" | "lectures" | "notes" | "tests";

const LessonItem = memo(({ lesson, index, isActive, onWatch }: {
  lesson: Lesson;
  index: number;
  isActive: boolean;
  onWatch: (l: Lesson) => void;
}) => {
  const type = lesson.lectureType;
  const isVideo = type === "VIDEO";

  const getIcon = () => {
    switch (type) {
      case "VIDEO": return <Play className="h-8 w-8 text-primary" />;
      case "PDF": case "NOTES": return <FileText className="h-8 w-8 text-purple-500" />;
      case "DPP": return <BookOpen className="h-8 w-8 text-orange-500" />;
      case "TEST": return <ClipboardCheck className="h-8 w-8 text-red-500" />;
      default: return <Play className="h-8 w-8 text-primary" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "VIDEO": return "LECTURE • VIDEO";
      case "PDF": return "PDF";
      case "NOTES": return "NOTES";
      case "DPP": return "DPP";
      case "TEST": return "TEST";
      default: return type;
    }
  };

  const getActionLabel = () => {
    switch (type) {
      case "VIDEO": return "Watch Lecture";
      case "TEST": return "Take Test";
      default: return "View";
    }
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-4 bg-card border border-border rounded-xl shadow-sm transition-colors",
        isActive && "ring-2 ring-primary"
      )}
    >
      <div className="relative min-w-[100px] h-[70px] bg-muted rounded-xl flex items-center justify-center">
        {getIcon()}
        <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 text-background text-[10px] text-center py-0.5 rounded-b-xl">
          {index + 1}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-medium text-foreground line-clamp-2">{lesson.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{getLabel()}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onWatch(lesson)}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {getActionLabel()}
          </button>
        </div>
      </div>
    </div>
  );
});

LessonItem.displayName = "LessonItem";

const LectureView = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: enrollment } = await supabase
            .from("enrollments").select("*")
            .eq("user_id", user.id).eq("course_id", Number(courseId)).eq("status", "active").maybeSingle();
          if (enrollment) setHasPurchased(true);
        }

        const { data: courseData, error: courseError } = await supabase
          .from("courses").select("id, title").eq("id", Number(courseId)).single();
        if (courseError) throw courseError;
        setCourse(courseData);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons").select("*").eq("course_id", Number(courseId)).order("position", { ascending: true });
        if (lessonsError) throw lessonsError;

        const formattedLessons: Lesson[] = (lessonsData || []).map((l: any, idx: number) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          videoUrl: l.video_url,
          isLocked: l.is_locked ?? false,
          courseId: l.course_id,
          lectureType: l.lecture_type || "VIDEO",
          position: l.position || idx + 1,
        }));

        setLessons(formattedLessons);

        if (lessonId) {
          const found = formattedLessons.find(l => l.id === lessonId);
          if (found) setCurrentLesson(found);
        } else if (formattedLessons.length > 0) {
          setCurrentLesson(formattedLessons[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, lessonId]);

  const canAccessLesson = (lesson: Lesson) => !lesson.isLocked || hasPurchased;

  const isDriveOrPdf = (url: string) => /drive\.google\.com/.test(url) || /\.pdf($|\?)/i.test(url);
  const isSheetUrl = (url: string) => /\.(xlsx|xls|csv)($|\?)/i.test(url);

  const handleWatchClick = (lesson: Lesson) => {
    if (canAccessLesson(lesson)) {
      setCurrentLesson(lesson);
      setShowPlayer(true);
    } else {
      toast.error("This lesson is locked. Please purchase the course.");
      navigate(`/buy-course?id=${courseId}`);
    }
  };

  const filteredLessons = lessons.filter(l => {
    if (activeTab === "all") return true;
    if (activeTab === "lectures") return l.lectureType === "VIDEO";
    if (activeTab === "notes") return l.lectureType === "NOTES" || l.lectureType === "PDF" || l.lectureType === "DPP";
    if (activeTab === "tests") return l.lectureType === "TEST";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const breadcrumbSegments = [
    { label: "My Courses", href: "/my-courses" },
    { label: course.title, href: `/classes/${courseId}/chapters` },
    ...(currentLesson ? [{ label: currentLesson.title }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Video Player Overlay */}
      {showPlayer && currentLesson && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col safe-area-inset">
          <button
            onClick={() => setShowPlayer(false)}
            className="absolute top-4 right-4 z-50 p-3 text-white bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
          >
            <X className="h-7 w-7" />
          </button>
          {isSheetUrl(currentLesson.videoUrl) ? (
            <div className="flex-1 w-full">
              <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <SheetViewer url={currentLesson.videoUrl} title={currentLesson.title} />
              </Suspense>
            </div>
          ) : isDriveOrPdf(currentLesson.videoUrl) ? (
            <div className="flex-1 w-full">
              <Suspense fallback={<Skeleton className="w-full h-full" />}>
                <DriveEmbedViewer url={currentLesson.videoUrl} title={currentLesson.title} />
              </Suspense>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-6xl">
                <PremiumVideoPlayer videoUrl={currentLesson.videoUrl} title={currentLesson.title} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbSegments} className="sticky top-0 z-20" />

      {/* Header */}
      <header className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/classes/${courseId}/chapters`)} className="text-primary">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            {currentLesson?.title || course.title}
          </h1>
        </div>
      </header>

      {/* Content Tabs */}
      <div className="px-5 mb-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lecture List */}
      <div className="p-5 space-y-4">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No content available for this filter.</p>
          </div>
        ) : (
          filteredLessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              isActive={currentLesson?.id === lesson.id}
              onWatch={handleWatchClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LectureView;
