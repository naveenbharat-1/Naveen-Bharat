import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Play, FileText, BookOpen, Grid3X3,
  Lock, Clock, CheckCircle, MessageCircle, Send,
  PanelLeftOpen, PanelLeftClose, X, ChevronLeft, Search,
  LayoutList, LayoutGrid, CheckCircle2, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import UnifiedVideoPlayer from "@/components/video/UnifiedVideoPlayer";
import PdfViewer from "@/components/video/PdfViewer";
import { Breadcrumbs } from "@/components/course/Breadcrumbs";
import { ChapterCard } from "@/components/course/ChapterCard";
import { LectureCard } from "@/components/course";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonActionBar from "@/components/video/LessonActionBar";
import CourseContent from "@/components/lecture/CourseContent";
import ObsidianNotes from "@/components/lecture/ObsidianNotes";
import { useLessonLikes } from "@/hooks/useLessonLikes";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  description: string | null;
  overview: string | null;
  isLocked: boolean | null;
  lectureType: string | null;
  position: number | null;
  youtubeId: string | null;
  createdAt: string | null;
  duration: number | null;
  chapterId: string | null;
  classPdfUrl: string | null;
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  grade: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

interface Chapter {
  id: string;
  title: string;
  code: string;
  position: number;
  parent_id: string | null;
  lessonCount: number;
  completedLessons: number;
}

type ContentType = "all" | "lectures" | "pdfs" | "dpp" | "notes";

// ── Static constants outside component — never recreated ──────────────────────
const typeMapping: Record<ContentType, string[]> = {
  all: [],
  lectures: ["VIDEO"],
  pdfs: ["PDF"],
  dpp: ["DPP"],
  notes: ["NOTES"],
};

const tabs: { id: ContentType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lectures", label: "Lectures" },
  { id: "pdfs", label: "PDFs" },
  { id: "dpp", label: "DPPs" },
  { id: "notes", label: "Notes" },
];

// ── Derives exact chapter completion counts from the source-of-truth sets ──────
// Prevents double-counting on re-entry, hot-reload, or concurrent updates.
const recomputeChapterCounts = (
  completedSet: Set<string>,
  allLessons: { id: string; chapterId: string | null }[],
  prevChapters: Chapter[]
): Chapter[] =>
  prevChapters.map(ch => {
    if (ch.id === "__all__") {
      return { ...ch, completedLessons: allLessons.filter(l => completedSet.has(l.id)).length };
    }
    const chLessons = allLessons.filter(l => l.chapterId === ch.id);
    return { ...ch, completedLessons: chLessons.filter(l => completedSet.has(l.id)).length };
  });

const MyCourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isAdmin, isTeacher } = useAuth();
  const isAdminOrTeacher = isAdmin || isTeacher;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courseSidebarOpen, setCourseSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const progressMarkedRef = useRef<Set<string>>(new Set());
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [chapterTab, setChapterTab] = useState<"chapters" | "material">("chapters");
  const [viewMode, setViewMode] = useState<"card" | "list">(() => {
    try { return (localStorage.getItem("sadguru_lesson_view") as "card" | "list") || "card"; } catch { return "card"; }
  });

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [selectedNoteUrl, setSelectedNoteUrl] = useState<{ url: string; title: string } | null>(null);
  const [inlineViewer, setInlineViewer] = useState<{ url: string; title: string } | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [activeDiscussionTab, setActiveDiscussionTab] = useState("overview");
  const [lastWatchedLessonId, setLastWatchedLessonId] = useState<string | null>(null);

  const handleViewModeChange = useCallback((mode: "card" | "list") => {
    setViewMode(mode);
    try { localStorage.setItem("sadguru_lesson_view", mode); } catch {}
  }, []);

  // Lesson likes — keyed to the selected lesson
  const { likeCount, hasLiked, toggleLike, loading: likesLoading } = useLessonLikes(selectedLesson?.id);

  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedLesson) return;
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("lesson_id", selectedLesson.id)
          .order("created_at", { ascending: true });
        if (!error && data) setComments(data.map((c: any) => ({
          id: c.id, userName: c.user_name, message: c.message, createdAt: c.created_at,
        })));
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    fetchComments();
  }, [selectedLesson]);

  // ── Optimistic comment append — no re-fetch needed ─────────────────────────
  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || !selectedLesson || !user) return;
    const optimisticComment = {
      id: crypto.randomUUID(),
      userName: profile?.fullName || "Anonymous",
      message: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, optimisticComment]);
    setNewComment("");
    try {
      const { error } = await supabase.from("comments").insert({
        lesson_id: selectedLesson.id,
        user_name: profile?.fullName || "Anonymous",
        message: optimisticComment.message,
        user_id: user.id,
      } as any);
      if (error) {
        // rollback on failure
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        throw error;
      }
      toast.success("Comment posted!");
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post comment");
    }
  }, [newComment, selectedLesson, user, profile]);

  const getYouTubeThumbnail = (url: string) => {
    const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      try {
        setLoading(true);

        const { data: courseData, error: courseErr } = await supabase
          .from("courses").select("*").eq("id", Number(courseId)).single();
        if (courseErr) throw courseErr;
        setCourse({
          id: courseData.id, title: courseData.title, description: courseData.description,
          grade: courseData.grade, imageUrl: courseData.image_url, thumbnailUrl: courseData.thumbnail_url,
        });

        if (user) {
          const { data: enrollment } = await supabase.from("enrollments").select("id")
            .eq("user_id", user.id).eq("course_id", Number(courseId)).eq("status", "active").maybeSingle();
          if (enrollment) setHasPurchased(true);
        }

        // ── Parallelise independent queries ─────────────────────────────────
        const [chaptersRes, lessonsRes, progressRes] = await Promise.all([
          supabase
            .from("chapters").select("*")
            .eq("course_id", Number(courseId))
            .is("parent_id", null)
            .order("position", { ascending: true }),
          supabase
            .from("lessons").select("*").eq("course_id", Number(courseId))
            .order("position", { ascending: true }),
          user?.id
            ? supabase
                .from("user_progress")
                .select("lesson_id, last_watched_at")
                .eq("user_id", user.id)
                .eq("course_id", Number(courseId))
                .eq("completed", true)
                .order("last_watched_at", { ascending: false })
            : Promise.resolve({ data: null }),
        ]);

        if (lessonsRes.error) throw lessonsRes.error;

        const mappedLessons: Lesson[] = (lessonsRes.data || []).map((l: any, idx: number) => ({
          id: l.id, title: l.title, videoUrl: l.video_url, description: l.description,
          overview: l.overview, isLocked: l.is_locked, lectureType: l.lecture_type || "VIDEO",
          position: l.position || idx + 1, youtubeId: l.youtube_id, createdAt: l.created_at,
          duration: l.duration, chapterId: l.chapter_id,
          classPdfUrl: l.class_pdf_url ?? null,
        }));
        setLessons(mappedLessons);

        let completedSet = new Set<string>();
        if (progressRes.data && progressRes.data.length > 0) {
          completedSet = new Set(progressRes.data.map((p: any) => p.lesson_id));
          setCompletedLessonIds(completedSet);
          setLastWatchedLessonId(progressRes.data[0].lesson_id);
        }

        const lessonCountMap: Record<string, number> = {};
        const completedCountMap: Record<string, number> = {};
        mappedLessons.forEach(l => {
          if (l.chapterId) {
            lessonCountMap[l.chapterId] = (lessonCountMap[l.chapterId] || 0) + 1;
            if (completedSet.has(l.id)) {
              completedCountMap[l.chapterId] = (completedCountMap[l.chapterId] || 0) + 1;
            }
          }
        });

        const totalLessons = mappedLessons.length;
        const totalCompleted = mappedLessons.filter(l => completedSet.has(l.id)).length;

        const allContentChapter: Chapter = {
          id: "__all__",
          code: "ALL",
          title: "All Content",
          position: -1,
          parent_id: null,
          lessonCount: totalLessons,
          completedLessons: totalCompleted,
        };

        const mappedChapters: Chapter[] = (chaptersRes.data || []).map((ch: any) => ({
          id: ch.id,
          code: ch.code,
          title: ch.title,
          position: ch.position,
          parent_id: ch.parent_id,
          lessonCount: lessonCountMap[ch.id] || 0,
          completedLessons: completedCountMap[ch.id] || 0,
        }));

        setChapters([allContentChapter, ...mappedChapters]);

      } catch (err) {
        console.error("Error fetching course data:", err);
        toast.error("Could not load course content");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user]);

  useEffect(() => {
    const lessonId = searchParams.get("lesson");
    if (lessonId && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) setSelectedLesson(lesson);
    }
  }, [searchParams, lessons]);

  // ── Memoised derived values — computed once per dependency change ──────────
  const selectedChapter = useMemo(
    () => chapters.find(ch => ch.id === selectedChapterId),
    [chapters, selectedChapterId]
  );

  const chapterLessons = useMemo(
    () =>
      !selectedChapterId || selectedChapterId === "__all__"
        ? lessons
        : lessons.filter(l => l.chapterId === selectedChapterId),
    [lessons, selectedChapterId]
  );

  const filteredLessons = useMemo(() => {
    const typeMatch = activeTab === "all"
      ? chapterLessons
      : chapterLessons.filter(l => typeMapping[activeTab].includes(l.lectureType || "VIDEO"));
    if (!lessonSearch.trim()) return typeMatch;
    const q = lessonSearch.toLowerCase();
    return typeMatch.filter(l => l.title.toLowerCase().includes(q));
  }, [chapterLessons, activeTab, lessonSearch]);

  const tabCounts = useMemo(() => ({
    all: chapterLessons.length,
    lectures: chapterLessons.filter(l => l.lectureType === "VIDEO").length,
    pdfs: chapterLessons.filter(l => l.lectureType === "PDF").length,
    dpp: chapterLessons.filter(l => l.lectureType === "DPP").length,
    notes: chapterLessons.filter(l => l.lectureType === "NOTES").length,
  }), [chapterLessons]);

  const filteredSidebarChapters = useMemo(() => {
    if (!sidebarSearch.trim()) return chapters;
    const q = sidebarSearch.toLowerCase();
    return chapters.filter(
      ch => ch.title.toLowerCase().includes(q) || ch.code.toLowerCase().includes(q)
    );
  }, [chapters, sidebarSearch]);

  // ── Memoised breadcrumbs ───────────────────────────────────────────────────
  const chapterBreadcrumbs = useMemo(() => [
    { label: "My Courses", href: "/my-courses" },
    ...(course ? [{ label: course.title }] : []),
  ], [course]);

  const lessonBreadcrumbs = useMemo(() => [
    { label: "My Courses", href: "/my-courses" },
    ...(course ? [{ label: course.title, href: `/my-courses/${courseId}` }] : []),
    ...(selectedChapter && selectedChapter.id !== "__all__"
      ? [{ label: `${selectedChapter.code} : ${selectedChapter.title}` }]
      : []),
  ], [course, courseId, selectedChapter]);

  const playerBreadcrumbs = useMemo(() => [
    { label: "My Courses", href: "/my-courses" },
    ...(course ? [{ label: course.title, href: `/my-courses/${courseId}` }] : []),
    ...(selectedLesson ? [{ label: selectedLesson.title }] : []),
  ], [course, courseId, selectedLesson]);

  // ── Memoised handlers — stable references across renders ──────────────────
  const handleContentClick = useCallback((lesson: Lesson) => {
    if (lesson.isLocked && !hasPurchased && !isAdminOrTeacher) {
      toast.error("This content is locked. Please purchase the course.");
      navigate(`/buy-course?id=${courseId}`);
      return;
    }
    if (lesson.lectureType === "VIDEO") {
      setSelectedLesson(lesson);
      setActiveDiscussionTab("overview");
      setSearchParams({ lesson: lesson.id });
    } else {
      if (lesson.videoUrl) {
        setSelectedLesson(lesson);
        setInlineViewer({ url: lesson.videoUrl, title: lesson.title });
        setActiveDiscussionTab("resources");
        setSearchParams({ lesson: lesson.id });
      } else {
        toast.error("No content URL available for this lesson.");
      }
    }
  }, [hasPurchased, isAdminOrTeacher, courseId, navigate, setSearchParams]);

  const handleClosePlayer = useCallback(() => {
    setSelectedLesson(null);
    setInlineViewer(null);
    setSearchParams({});
    setLessonSearch("");
  }, [setSearchParams]);

  // ── Manual complete for PDF / DPP / NOTES (no video playback) ───────────────
  const handleManualComplete = useCallback(async (lesson: Lesson) => {
    if (!user || !courseId) return;
    if (completedLessonIds.has(lesson.id)) return; // already done

    const lessonId = lesson.id;

    // Optimistic UI: add to set, recompute counts from source of truth
    setCompletedLessonIds(prev => {
      if (prev.has(lessonId)) return prev;
      const next = new Set([...prev, lessonId]);
      setChapters(chs => recomputeChapterCounts(next, lessons, chs));
      return next;
    });

    try {
      const { error } = await supabase.from("user_progress").upsert({
        user_id: user.id,
        lesson_id: lessonId,
        course_id: Number(courseId),
        completed: true,
        watched_seconds: 0,
        last_watched_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });
      if (error) throw error;
      progressMarkedRef.current.add(lessonId);
      toast.success("Marked as complete! 🎉");
    } catch (err) {
      // Rollback: remove from set, recompute
      setCompletedLessonIds(prev => {
        const next = new Set(prev);
        next.delete(lessonId);
        setChapters(chs => recomputeChapterCounts(next, lessons, chs));
        return next;
      });
      toast.error("Failed to mark complete");
    }
  }, [user, courseId, completedLessonIds, lessons]);

  // ── Single upsert + real-time chapter progress recalculation ──────────────
  const handleVideoProgress = useCallback(async (state: { played: number; playedSeconds: number }) => {
    if (!user || !selectedLesson || !courseId) return;
    if (state.played < 0.9) return;
    if (progressMarkedRef.current.has(selectedLesson.id)) return;
    progressMarkedRef.current.add(selectedLesson.id);

    try {
      const { error } = await supabase.from("user_progress").upsert({
        user_id: user.id,
        lesson_id: selectedLesson.id,
        course_id: Number(courseId),
        completed: true,
        watched_seconds: Math.floor(state.playedSeconds),
        last_watched_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });

      if (error) throw error;

      const lessonId = selectedLesson.id;

      // Atomic: add to completed set and recompute chapter counts from source of truth
      setCompletedLessonIds(prev => {
        if (prev.has(lessonId)) return prev;
        const next = new Set([...prev, lessonId]);
        setChapters(chs => recomputeChapterCounts(next, lessons, chs));
        return next;
      });

      setLastWatchedLessonId(lessonId);
      toast.success("Lesson marked as complete! 🎉");
    } catch (err) {
      console.error("Error marking lesson complete:", err);
      progressMarkedRef.current.delete(selectedLesson.id);
    }
  }, [user, selectedLesson, courseId, lessons]);

  // ── LOADING STATE ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-5 space-y-3 max-w-2xl mx-auto w-full">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />

      {/* Inline PDF Viewer overlay */}
      {inlineViewer && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <header className="flex items-center gap-2 border-b bg-background shrink-0">
            <Button variant="ghost" size="icon" className="ml-2 shrink-0" onClick={() => setInlineViewer(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0 overflow-hidden">
              <Breadcrumbs
                segments={[
                  { label: "My Courses", href: "/my-courses" },
                  { label: course?.title || "", href: `/my-courses/${courseId}` },
                  { label: inlineViewer.title },
                ]}
                className="border-b-0 py-3 px-1 bg-transparent backdrop-blur-none"
              />
            </div>
          </header>
          <div className="flex-1 min-h-0 p-3">
            <PdfViewer url={inlineViewer.url} title={inlineViewer.title} />
          </div>
        </div>
      )}

      {/* Mobile course sidebar backdrop */}
      {courseSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setCourseSidebarOpen(false)} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter Sidebar */}
        <aside className={cn(
          "fixed md:sticky top-0 md:top-auto z-40 h-full md:h-auto flex-shrink-0 bg-card border-r flex flex-col transition-all duration-300",
          courseSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          sidebarCollapsed ? "md:w-0 md:overflow-hidden md:border-r-0" : "w-64 md:w-64"
        )}>
          <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</span>
            <button onClick={() => setCourseSidebarOpen(false)} className="md:hidden p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="px-3 py-2 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted rounded-md border-0 outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch("")}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredSidebarChapters.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 px-2">
                  No chapters found
                </p>
              ) : filteredSidebarChapters.map((chapter) => {
                const isActive = selectedChapterId === chapter.id || (!selectedChapterId && chapter.id === "__all__");
                const pct = chapter.lessonCount > 0
                  ? Math.round((chapter.completedLessons / chapter.lessonCount) * 100)
                  : 0;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      setSelectedLesson(null);
                      setSearchParams({});
                      setLessonSearch("");
                      setCourseSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex flex-col px-3 py-2 rounded-lg text-sm text-left transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-2.5"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {/* Top row */}
                    <div className="flex items-center gap-2 w-full">
                      <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded shrink-0",
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {chapter.code}
                      </span>
                      <span className="flex-1 truncate leading-snug">{chapter.title}</span>
                      {chapter.lessonCount > 0 && (
                        <span className={cn(
                          "text-xs px-1 py-0.5 rounded-full shrink-0",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {chapter.lessonCount}
                        </span>
                      )}
                    </div>
                    {/* Progress bar row */}
                    {chapter.lessonCount > 0 && (
                      <div className="mt-1.5 w-full space-y-0.5 pl-7">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              pct === 100 ? "bg-green-500" : "bg-primary"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {chapter.completedLessons}/{chapter.lessonCount} done
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-background">
          {/* Sticky header */}
          <header className="px-4 pt-5 pb-3 sticky top-0 z-20 bg-background border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedLesson) {
                    handleClosePlayer();
                  } else if (selectedChapterId) {
                    setSelectedChapterId(null);
                  } else {
                    navigate("/my-courses");
                  }
                }}
                className="text-primary hover:opacity-80 transition-opacity"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-foreground line-clamp-1 flex-1">
                {selectedLesson
                  ? selectedLesson.title
                  : selectedChapter && selectedChapter.id !== "__all__"
                    ? `${selectedChapter.code} : ${selectedChapter.title}`
                    : course.title}
              </h1>
              {/* Resume last watched — only show when no lesson is open */}
              {!selectedLesson && lastWatchedLessonId && (() => {
                const resumeLesson = lessons.find(l => l.id === lastWatchedLessonId);
                if (!resumeLesson) return null;
                return (
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5 h-8 text-xs font-medium"
                    onClick={() => {
                      setSelectedLesson(resumeLesson);
                      setSearchParams({ lesson: resumeLesson.id });
                    }}
                  >
                    <Play className="h-3 w-3" />
                    Resume
                  </Button>
                );
              })()}
              {/* Desktop sidebar collapse toggle */}
              <button
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="hidden md:flex p-2 rounded-lg border bg-card text-muted-foreground hover:bg-muted transition-colors"
                title={sidebarCollapsed ? "Show chapters" : "Hide chapters"}
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen className="h-4 w-4" />
                  : <PanelLeftClose className="h-4 w-4" />
                }
              </button>
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setCourseSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg border bg-card text-muted-foreground hover:bg-muted transition-colors"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Breadcrumbs */}
          <Breadcrumbs
            segments={selectedLesson ? playerBreadcrumbs : selectedChapterId ? lessonBreadcrumbs : chapterBreadcrumbs}
            className="sticky top-[60px] z-10"
          />

          {/* ── STATE 1: Chapter grid ── */}
          {!selectedChapterId && !selectedLesson && (
            <>
              <div className="flex gap-6 px-5 border-b border-border">
                <button
                  onClick={() => setChapterTab("chapters")}
                  className={cn(
                    "pb-3 text-base font-medium relative transition-colors",
                    chapterTab === "chapters" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Subjects
                  {chapterTab === "chapters" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setChapterTab("material")}
                  className={cn(
                    "pb-3 text-base font-medium relative transition-colors",
                    chapterTab === "material" ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Study Material
                  {chapterTab === "material" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
                  )}
                </button>
              </div>

              <div className="p-5 space-y-3">
                {chapterTab === "chapters" &&
                  chapters.map((chapter) => (
                    <ChapterCard
                      key={chapter.id}
                      code={chapter.code}
                      title={chapter.title}
                      lectureCount={chapter.lessonCount}
                      completedLectures={chapter.completedLessons}
                      onClick={() => { setSelectedChapterId(chapter.id); setLessonSearch(""); }}
                    />
                  ))
                }
                {chapterTab === "material" && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No study material available yet.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── STATE 2: Lesson list ── */}
          {selectedChapterId && !selectedLesson && (() => {
            // Compute chapter-level completion (all types, not tab-filtered)
            const chapterLessons = selectedChapterId === "__all__"
              ? lessons
              : lessons.filter(l => l.chapterId === selectedChapterId);
            const totalInChapter = chapterLessons.length;
            const completedInChapter = chapterLessons.filter(l => completedLessonIds.has(l.id)).length;
            const pct = totalInChapter > 0 ? Math.round((completedInChapter / totalInChapter) * 100) : 0;
            const circumference = 2 * Math.PI * 14; // r=14 → ~88
            const strokeDashoffset = circumference - (pct / 100) * circumference;
            const isAllDone = totalInChapter > 0 && completedInChapter === totalInChapter;

            return (
              <>
                {/* ── Completion banner ── */}
                {totalInChapter > 0 && (
                  <div className={cn(
                    "mx-5 mt-3 px-4 py-3 rounded-xl border flex items-center gap-3 transition-all",
                    isAllDone
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40"
                      : "bg-primary/5 border-primary/10"
                  )}>
                    {/* Circular progress ring */}
                    <div className="shrink-0">
                      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
                        <circle
                          cx="18" cy="18" r="14"
                          fill="none"
                          strokeWidth="3"
                          className="stroke-muted"
                        />
                        <circle
                          cx="18" cy="18" r="14"
                          fill="none"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className={isAllDone ? "stroke-green-500" : "stroke-primary"}
                          style={{ transition: "stroke-dashoffset 0.4s ease" }}
                        />
                        <text
                          x="18" y="18"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="rotate-90"
                          style={{ transform: "rotate(90deg) translate(0px, -36px)", fontSize: "8px", fontWeight: 700, fill: "currentColor" }}
                        />
                      </svg>
                      {/* Percentage label in center */}
                      <div className="relative -mt-[34px] flex items-center justify-center h-[36px]">
                        <span className={cn(
                          "text-[10px] font-bold tabular-nums",
                          isAllDone ? "text-green-600 dark:text-green-400" : "text-primary"
                        )}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      {isAllDone ? (
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Chapter complete! 🎉
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          {completedInChapter} of {totalInChapter} lessons
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAllDone ? "All lessons completed" : `${totalInChapter - completedInChapter} remaining`}
                      </p>
                    </div>

                    {/* Trophy / checkmark badge */}
                    {isAllDone ? (
                      <Trophy className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <div className="shrink-0 text-right">
                        <span className="text-xs text-muted-foreground tabular-nums font-medium">
                          {completedInChapter}/{totalInChapter}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab bar + view toggle */}
                <div className="flex items-center gap-2 px-5 py-2">
                  <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
                    {tabs.map((tab) => {
                      const count = tabCounts[tab.id];
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/60 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {tab.label}
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 shrink-0 bg-muted/50 rounded-lg p-1">
                    <button
                      onClick={() => handleViewModeChange("card")}
                      title="Card view"
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === "card"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange("list")}
                      title="List view"
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-5 pb-1 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search lessons…"
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-muted rounded-xl border-0 outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                    />
                    {lessonSearch && (
                      <button
                        onClick={() => setLessonSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                <div className={cn("p-5", viewMode === "list" ? "space-y-2" : "space-y-4")}>
                  {filteredLessons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        {lessonSearch ? `No lessons match "${lessonSearch}"` : "No content found"}
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {lessonSearch ? "Try a different search term." : "Try switching tabs or check back later."}
                      </p>
                    </div>
                  ) : (
                    <div className={viewMode === "list" ? "space-y-1.5" : "space-y-4"}>
                      {filteredLessons.map((lesson) => (
                        <LectureCard
                          key={lesson.id}
                          id={lesson.id}
                          title={lesson.title}
                          lectureType={(lesson.lectureType || "VIDEO") as "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST"}
                          position={lesson.position ?? undefined}
                          duration={lesson.duration}
                          createdAt={lesson.createdAt}
                          isLocked={!!lesson.isLocked && !hasPurchased && !isAdminOrTeacher}
                          isCompleted={completedLessonIds.has(lesson.id)}
                          onClick={() => handleContentClick(lesson)}
                          compact={viewMode === "list"}
                          onMarkComplete={
                            lesson.lectureType !== "VIDEO" && !completedLessonIds.has(lesson.id)
                              ? (e) => { e.stopPropagation(); handleManualComplete(lesson); }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* ── STATE 3: Inline lesson player ── */}
          {selectedLesson && (
            <div className="flex flex-col">
              {/* Video player */}
              <div className="w-full bg-black min-h-[200px]">
                {(() => {
                  // Find next lesson in the current chapter/filtered list
                  const currentIndex = filteredLessons.findIndex(l => l.id === selectedLesson.id);
                  const nextLesson = currentIndex >= 0 && currentIndex < filteredLessons.length - 1
                    ? filteredLessons[currentIndex + 1]
                    : null;
                  return (
                    <UnifiedVideoPlayer
                      url={selectedLesson.videoUrl}
                      title={selectedLesson.title}
                      lessonId={selectedLesson.id}
                      onReady={() => {}}
                      onProgress={handleVideoProgress}
                      onNextVideo={nextLesson ? () => handleContentClick(nextLesson) : undefined}
                      nextVideoTitle={nextLesson?.title}
                    />
                  );
                })()}
              </div>

              {/* Like / Doubts / PDF action bar */}
              <LessonActionBar
                likeCount={likeCount}
                hasLiked={hasLiked}
                onLike={toggleLike}
                onDoubts={() => setActiveDiscussionTab("discussion")}
                onDownloadPdf={selectedLesson.classPdfUrl ? () => { setInlineViewer({ url: selectedLesson.classPdfUrl!, title: `${selectedLesson.title} – Class PDF` }); setActiveDiscussionTab("resources"); } : undefined}
                hasPdf={!!selectedLesson.classPdfUrl}
              />

              {/* Tabs: Overview / Discussion / Resources / Notes */}
              <Tabs value={activeDiscussionTab} onValueChange={setActiveDiscussionTab} className="flex-1">
                <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 gap-1 h-auto py-0">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "discussion", label: "Discussion" },
                    { id: "resources", label: "Resources" },
                    { id: "notes", label: "Notes" },
                  ].map(t => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-3 text-sm"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="p-4">
                  <div className="space-y-3">
                    {selectedLesson.overview && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">Overview</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedLesson.overview}</p>
                      </div>
                    )}
                    {selectedLesson.description && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-1 text-sm">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedLesson.description}</p>
                      </div>
                    )}
                    {!selectedLesson.overview && !selectedLesson.description && (
                      <p className="text-sm text-muted-foreground">No overview available for this lesson.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="p-4 space-y-4">
                  <h3 className="font-semibold text-foreground">Discussion</h3>
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{c.userName?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-foreground">{c.userName}</p>
                        <p className="text-sm text-foreground mt-0.5">{c.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 min-h-[60px] resize-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(); }
                        }}
                      />
                      <Button size="icon" onClick={handlePostComment} disabled={!newComment.trim()} className="shrink-0 self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resources" className="p-4">
                  <div className="space-y-3">
                    {selectedLesson.classPdfUrl && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">Class PDF</p>
                          <p className="text-xs text-muted-foreground">Download or view class notes</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setInlineViewer({ url: selectedLesson.classPdfUrl!, title: `${selectedLesson.title} – Class PDF` })}>
                          View
                        </Button>
                      </div>
                    )}
                    {!selectedLesson.classPdfUrl && (
                      <p className="text-sm text-muted-foreground">No resources attached to this lesson.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-4">
                  <ObsidianNotes
                    lessonId={selectedLesson.id}
                    userId={user?.id}
                    lessonTitle={selectedLesson.title}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyCourseDetail;
