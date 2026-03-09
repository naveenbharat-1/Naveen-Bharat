import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronRight, Video, FileText, BookOpen, Search,
  Trash2, ExternalLink, CheckCircle, Upload, ClipboardCheck,
  Lock, Unlock, Edit2, Hash, GripVertical, Plus, FolderOpen, Clock, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContentDrillDownProps {
  coursesList: any[];
  onNavigateToUpload: (courseId: string, chapterId: string) => void;
  onRefresh: () => void;
}

type ContentTypeFilter = "all" | "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST";
type ViewMode = "cards" | "table";

const ContentDrillDown = ({ coursesList, onNavigateToUpload, onRefresh }: ContentDrillDownProps) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSubChapterId, setSelectedSubChapterId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [subChapters, setSubChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonSearch, setLessonSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>("all");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Chapter creation state
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterCode, setNewChapterCode] = useState("");
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);

  // Sub-folder creation state
  const [showCreateSubFolder, setShowCreateSubFolder] = useState(false);
  const [newSubFolderTitle, setNewSubFolderTitle] = useState("");
  const [newSubFolderCode, setNewSubFolderCode] = useState("");

  // Inline edit state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState({
    title: "", video_url: "", lecture_type: "VIDEO", chapter_id: "",
    description: "", position: "0", is_locked: false,
  });
  const [editChaptersList, setEditChaptersList] = useState<any[]>([]);

  // Inline upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<"video" | "pdf" | "dpp" | "notes" | "test">("video");
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedCourse = coursesList.find(c => c.id === selectedCourseId);

  useEffect(() => {
    if (!selectedCourseId) { setChapters([]); return; }
    setLoading(true);
    const fetch = async () => {
      const { data } = await supabase
        .from("chapters").select("*")
        .eq("course_id", selectedCourseId)
        .is("parent_id", null)
        .order("position", { ascending: true });
      setChapters(data || []);
      setLoading(false);
    };
    fetch();
  }, [selectedCourseId]);

  // Fetch sub-chapters when a chapter is selected
  useEffect(() => {
    if (!selectedChapterId || selectedChapterId === "__all__") { setSubChapters([]); return; }
    const fetchSub = async () => {
      const { data } = await supabase
        .from("chapters").select("*")
        .eq("parent_id", selectedChapterId)
        .order("position", { ascending: true });
      setSubChapters(data || []);
    };
    fetchSub();
  }, [selectedChapterId]);

  useEffect(() => {
    if (!selectedCourseId) { setLessons([]); return; }
    // Only fetch lessons when we're at the lesson level
    const activeChapterId = selectedSubChapterId || selectedChapterId;
    if (!activeChapterId) { setLessons([]); return; }
    setLoading(true);
    const fetch = async () => {
      let query = supabase.from("lessons").select("*");
      if (activeChapterId === "__all__") {
        query = query.eq("course_id", selectedCourseId);
      } else {
        query = query.eq("chapter_id", activeChapterId);
      }
      const { data } = await query.order("position", { ascending: true });
      setLessons(data || []);
      setLoading(false);
    };
    fetch();
  }, [selectedCourseId, selectedChapterId, selectedSubChapterId]);

  const [chapterLessonCounts, setChapterLessonCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!selectedCourseId || chapters.length === 0) return;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const ch of chapters) {
        const { count } = await supabase
          .from("lessons").select("*", { count: "exact", head: true })
          .eq("chapter_id", ch.id);
        counts[ch.id] = count || 0;
      }
      setChapterLessonCounts(counts);
    };
    fetchCounts();
  }, [selectedCourseId, chapters]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = l.title?.toLowerCase().includes(lessonSearch.toLowerCase());
      const matchesType = typeFilter === "all" || l.lecture_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [lessons, lessonSearch, typeFilter]);

  const typeCounts = useMemo(() => ({
    all: lessons.length,
    VIDEO: lessons.filter(l => l.lecture_type === "VIDEO").length,
    PDF: lessons.filter(l => l.lecture_type === "PDF").length,
    DPP: lessons.filter(l => l.lecture_type === "DPP").length,
    NOTES: lessons.filter(l => l.lecture_type === "NOTES").length,
    TEST: lessons.filter(l => l.lecture_type === "TEST").length,
  }), [lessons]);

  // --- Chapter CRUD ---
  const handleCreateChapter = async (parentId?: string) => {
    if (!newChapterTitle.trim()) return toast.error("Chapter title required");
    setIsCreatingChapter(true);
    const code = newChapterCode.trim() || newChapterTitle.trim().substring(0, 10).toUpperCase().replace(/\s/g, '-');
    const { error } = await supabase.from("chapters").insert({
      title: newChapterTitle.trim(),
      code,
      course_id: selectedCourseId!,
      position: parentId ? subChapters.length : chapters.length,
      parent_id: parentId || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(parentId ? "Sub-folder created!" : "Chapter created!");
      setNewChapterTitle("");
      setNewChapterCode("");
      setShowCreateChapter(false);
      setShowCreateSubFolder(false);
      setNewSubFolderTitle("");
      setNewSubFolderCode("");
      // Refresh
      if (parentId) {
        const { data } = await supabase.from("chapters").select("*").eq("parent_id", parentId).order("position");
        setSubChapters(data || []);
      } else {
        const { data } = await supabase.from("chapters").select("*").eq("course_id", selectedCourseId!).is("parent_id", null).order("position");
        setChapters(data || []);
      }
      onRefresh();
    }
    setIsCreatingChapter(false);
  };

  const handleCreateSubFolder = async () => {
    if (!newSubFolderTitle.trim()) return toast.error("Sub-folder title required");
    setIsCreatingChapter(true);
    const code = newSubFolderCode.trim() || newSubFolderTitle.trim().substring(0, 10).toUpperCase().replace(/\s/g, '-');
    const { error } = await supabase.from("chapters").insert({
      title: newSubFolderTitle.trim(),
      code,
      course_id: selectedCourseId!,
      position: subChapters.length,
      parent_id: selectedChapterId,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Sub-folder created!");
      setNewSubFolderTitle("");
      setNewSubFolderCode("");
      setShowCreateSubFolder(false);
      const { data } = await supabase.from("chapters").select("*").eq("parent_id", selectedChapterId).order("position");
      setSubChapters(data || []);
      onRefresh();
    }
    setIsCreatingChapter(false);
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Delete this chapter? Lessons inside will be unlinked.")) return;
    // Unlink lessons first
    await supabase.from("lessons").update({ chapter_id: null }).eq("chapter_id", id);
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (!error) {
      toast.success("Chapter deleted");
      setChapters(prev => prev.filter(c => c.id !== id));
      onRefresh();
    }
  };

  // --- Lesson CRUD ---
  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (!error) {
      toast.success("Deleted");
      setLessons(prev => prev.filter(l => l.id !== id));
      onRefresh();
    }
  };

  const handleToggleLock = async (id: string, currentLocked: boolean) => {
    const { error } = await supabase.from("lessons").update({ is_locked: !currentLocked }).eq("id", id);
    if (!error) {
      setLessons(prev => prev.map(l => l.id === id ? { ...l, is_locked: !currentLocked } : l));
      toast.success(currentLocked ? "Unlocked" : "Locked");
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setEditLessonData({
      title: lesson.title || "",
      video_url: lesson.video_url || "",
      lecture_type: lesson.lecture_type || "VIDEO",
      chapter_id: lesson.chapter_id || "",
      description: lesson.description || "",
      position: String(lesson.position || 0),
      is_locked: lesson.is_locked || false,
    });
    setEditChaptersList(chapters);
  };

  const handleSaveLessonEdit = async () => {
    if (!editingLessonId) return;
    const { error } = await supabase.from("lessons").update({
      title: editLessonData.title,
      video_url: editLessonData.video_url,
      lecture_type: editLessonData.lecture_type,
      chapter_id: editLessonData.chapter_id || null,
      description: editLessonData.description || null,
      position: parseInt(editLessonData.position) || 0,
      is_locked: editLessonData.is_locked,
    }).eq("id", editingLessonId);
    if (error) toast.error(error.message);
    else {
      toast.success("Lesson updated!");
      setEditingLessonId(null);
      // Refresh lessons
      const chId = selectedChapterId;
      setSelectedChapterId(null);
      setTimeout(() => setSelectedChapterId(chId), 0);
      onRefresh();
    }
  };

  // --- Inline Upload Handler ---
  const handleInlineUpload = async () => {
    if (!uploadTitle || !selectedCourseId) return toast.error("Fill title");
    setIsUploading(true);
    try {
      let contentUrl = "";
      if (uploadMode === "file" && uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const isVideo = uploadType === "video";
        const bucket = isVideo ? 'course-videos' : 'content';
        const filePath = `lessons/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, uploadFile);
        if (uploadError) throw uploadError;
        if (isVideo) {
          const { data: signedData, error: signError } = await supabase.storage.from(bucket).createSignedUrl(filePath, 86400 * 365);
          if (signError) throw signError;
          contentUrl = signedData.signedUrl;
        } else {
          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
          contentUrl = publicUrl;
        }
      } else {
        contentUrl = uploadUrl;
      }
      if (!contentUrl) return toast.error("Provide a URL or upload a file");

      const lectureTypeMap: Record<string, string> = { video: "VIDEO", pdf: "PDF", dpp: "DPP", notes: "NOTES", test: "TEST" };
      const activeChId = selectedSubChapterId || selectedChapterId;
      const insertData: any = {
        course_id: selectedCourseId,
        title: uploadTitle,
        video_url: contentUrl,
        lecture_type: lectureTypeMap[uploadType],
        description: uploadDescription || `${uploadType.toUpperCase()} content`,
        is_locked: true,
      };
      if (activeChId && activeChId !== "__all__") insertData.chapter_id = activeChId;

      const { error } = await supabase.from('lessons').insert(insertData);
      if (error) throw error;
      toast.success("Content uploaded!");
      setUploadTitle(""); setUploadUrl(""); setUploadDescription(""); setUploadFile(null);
      setShowUploadDialog(false);
      // Refresh lessons
      const chId = selectedChapterId;
      setSelectedChapterId(null);
      setTimeout(() => setSelectedChapterId(chId), 0);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const typeIcon = (type: string) => {
    if (type === "VIDEO") return <Video className="h-4 w-4" />;
    if (type === "TEST") return <ClipboardCheck className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const typeColor = (type: string) => {
    if (type === "VIDEO") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (type === "PDF") return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    if (type === "DPP") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (type === "NOTES") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    if (type === "TEST") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    return "bg-muted text-muted-foreground";
  };

  const tabs: { id: ContentTypeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "VIDEO", label: "Video" },
    { id: "PDF", label: "PDF" },
    { id: "DPP", label: "DPP" },
    { id: "NOTES", label: "Notes" },
    { id: "TEST", label: "Test" },
  ];

  // === BREADCRUMB ===
  const renderBreadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm mb-4 flex-wrap">
      <button
        onClick={() => { setSelectedCourseId(null); setSelectedChapterId(null); setSelectedSubChapterId(null); }}
        className="hover:text-primary transition-colors text-muted-foreground"
      >
        Dashboard
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <button
        onClick={() => { setSelectedCourseId(null); setSelectedChapterId(null); setSelectedSubChapterId(null); }}
        className={cn(
          "hover:text-primary transition-colors",
          !selectedCourseId ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        All Courses
      </button>
      {selectedCourse && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <button
            onClick={() => { setSelectedChapterId(null); setSelectedSubChapterId(null); }}
            className={cn(
              "hover:text-primary transition-colors",
              !selectedChapterId ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {selectedCourse.title}
          </button>
        </>
      )}
      {selectedChapterId && selectedChapterId !== "__all__" && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <button
            onClick={() => setSelectedSubChapterId(null)}
            className={cn(
              "hover:text-primary transition-colors",
              !selectedSubChapterId ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {chapters.find(c => c.id === selectedChapterId)?.title || "Subject"}
          </button>
        </>
      )}
      {selectedSubChapterId && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground">
            {subChapters.find(c => c.id === selectedSubChapterId)?.title || "Sub-folder"}
          </span>
        </>
      )}
      {selectedChapterId === "__all__" && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground">All Lessons</span>
        </>
      )}
    </nav>
  );

  // === LEVEL 1: Course Grid ===
  if (!selectedCourseId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <p className="text-sm text-muted-foreground">Select a course to manage its content</p>
        </CardHeader>
        <CardContent>
          {renderBreadcrumb()}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesList.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className="p-4 border rounded-xl bg-card hover:border-primary hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Grade {course.grade} • ₹{course.price}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {coursesList.length === 0 && (
              <p className="text-center text-muted-foreground py-10 col-span-full">No courses found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // === LEVEL 2: Chapter List with Create Chapter ===
  if (!selectedChapterId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>{selectedCourse?.title} — Subjects</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreateChapter(!showCreateChapter)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Create Subject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-1" /> Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderBreadcrumb()}

          {/* Inline Create Chapter Form */}
          {showCreateChapter && (
            <div className="p-4 mb-4 border-2 border-primary/30 rounded-xl bg-primary/5 space-y-3">
              <p className="text-sm font-semibold text-primary">New Subject</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Subject title (e.g. Kinematics)"
                  value={newChapterTitle}
                  onChange={e => setNewChapterTitle(e.target.value)}
                />
                <Input
                  placeholder="Code (optional, e.g. CH-KIN)"
                  value={newChapterCode}
                  onChange={e => setNewChapterCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleCreateChapter()} disabled={isCreatingChapter}>
                  {isCreatingChapter ? "Creating..." : "Create"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateChapter(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* "View All" button */}
          <button
            onClick={() => setSelectedChapterId("__all__")}
            className="w-full p-4 border rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">All Lessons</p>
                  <p className="text-xs text-muted-foreground">View all content for this course</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading subjects...</p>
          ) : chapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No subjects yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch, index) => (
                <div
                  key={ch.id}
                  className="w-full p-3 border rounded-xl bg-card hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedChapterId(ch.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{ch.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ch.code}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {chapterLessonCounts[ch.id] ?? "..."} lessons
                          </Badge>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ch.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // === LEVEL 3: Chapter detail (sub-folders + lessons) ===
  const activeChapterId = selectedSubChapterId || selectedChapterId;
  const chapterTitle = selectedSubChapterId
    ? subChapters.find(c => c.id === selectedSubChapterId)?.title
    : selectedChapterId === "__all__"
      ? `${selectedCourse?.title} — All Lessons`
      : chapters.find(c => c.id === selectedChapterId)?.title || "Subject";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <CardTitle className="text-base">{chapterTitle}</CardTitle>
          <div className="flex items-center gap-2">
            {selectedChapterId !== "__all__" && !selectedSubChapterId && (
              <Button size="sm" variant="outline" onClick={() => setShowCreateSubFolder(!showCreateSubFolder)} className="gap-1">
                <Plus className="h-4 w-4" /> Sub-Folder
              </Button>
            )}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={cn("px-3 py-1.5 text-xs font-medium", viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn("px-3 py-1.5 text-xs font-medium", viewMode === "cards" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Cards
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderBreadcrumb()}

        {/* Create Sub-Folder Form */}
        {showCreateSubFolder && selectedChapterId !== "__all__" && !selectedSubChapterId && (
          <div className="p-4 mb-4 border-2 border-primary/30 rounded-xl bg-primary/5 space-y-3">
            <p className="text-sm font-semibold text-primary">New Sub-Folder</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Sub-folder title"
                value={newSubFolderTitle}
                onChange={e => setNewSubFolderTitle(e.target.value)}
              />
              <Input
                placeholder="Code (optional)"
                value={newSubFolderCode}
                onChange={e => setNewSubFolderCode(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateSubFolder} disabled={isCreatingChapter}>
                {isCreatingChapter ? "Creating..." : "Create"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateSubFolder(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Sub-chapters list (only at chapter level, not sub-chapter or __all__) */}
        {subChapters.length > 0 && !selectedSubChapterId && selectedChapterId !== "__all__" && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub-Folders</p>
            {subChapters.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => setSelectedSubChapterId(sc.id)}
                className="w-full p-3 border rounded-xl bg-card hover:border-primary hover:shadow-sm transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{sc.title}</p>
                    <span className="text-xs text-muted-foreground">{sc.code}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}

        {/* Type filter tabs — only at Level 3 */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                typeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                typeFilter === tab.id ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {typeCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Inline Edit Form */}
        {editingLessonId && (
          <div className="p-4 mb-3 border-2 border-primary/30 rounded-xl bg-primary/5 space-y-3">
            <p className="text-sm font-semibold text-primary">Editing Lesson</p>
            <Input value={editLessonData.title} onChange={e => setEditLessonData({ ...editLessonData, title: e.target.value })} placeholder="Title" />
            <Input value={editLessonData.video_url} onChange={e => setEditLessonData({ ...editLessonData, video_url: e.target.value })} placeholder="URL" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Select value={editLessonData.lecture_type} onValueChange={v => setEditLessonData({ ...editLessonData, lecture_type: v })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DPP">DPP</SelectItem>
                  <SelectItem value="NOTES">Notes</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={editLessonData.position} onChange={e => setEditLessonData({ ...editLessonData, position: e.target.value })} placeholder="Position" />
              {editChaptersList.length > 0 && (
                <Select value={editLessonData.chapter_id} onValueChange={v => setEditLessonData({ ...editLessonData, chapter_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    {editChaptersList.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Textarea value={editLessonData.description} onChange={e => setEditLessonData({ ...editLessonData, description: e.target.value })} placeholder="Description" rows={2} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={editLessonData.is_locked} onCheckedChange={v => setEditLessonData({ ...editLessonData, is_locked: v })} />
                Locked
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveLessonEdit}><CheckCircle className="h-3 w-3 mr-1" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingLessonId(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Lessons — Table View */}
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Loading...</p>
        ) : filteredLessons.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No content found.</p>
        ) : viewMode === "table" ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map(l => (
                  <TableRow key={l.id} className={cn(editingLessonId === l.id && "bg-primary/5")}>
                    <TableCell className="px-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{l.position}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm truncate max-w-[250px]">{l.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5", typeColor(l.lecture_type))}>
                        {l.lecture_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleLock(l.id, l.is_locked)}
                        className={cn("p-1 rounded", l.is_locked ? "text-destructive" : "text-green-600")}
                        title={l.is_locked ? "Locked — click to unlock" : "Unlocked — click to lock"}
                      >
                        {l.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {l.video_url && (
                          <a href={l.video_url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditLesson(l)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLesson(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Card View */
          <ScrollArea className="h-[450px]">
            <div className="space-y-2">
              {filteredLessons.map(l => (
                <div key={l.id} className="p-3 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                      <div className={cn("p-2 rounded", typeColor(l.lecture_type))}>
                        {typeIcon(l.lecture_type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{l.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{l.lecture_type}</Badge>
                          <span className="flex items-center gap-0.5"><Hash className="h-3 w-3" />{l.position}</span>
                          {l.is_locked ? <Lock className="h-3 w-3 text-destructive" /> : <Unlock className="h-3 w-3 text-green-600" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleLock(l.id, l.is_locked)}
                        className={cn("p-1.5 rounded-md hover:bg-muted", l.is_locked ? "text-destructive" : "text-green-600")}
                      >
                        {l.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                      {l.video_url && (
                        <a href={l.video_url} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditLesson(l)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteLesson(l.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Inline Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title}
              {selectedChapterId && selectedChapterId !== "__all__" && ` › ${chapters.find(c => c.id === selectedChapterId)?.title}`}
              {selectedSubChapterId && ` › ${subChapters.find(c => c.id === selectedSubChapterId)?.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Content Type */}
            <div className="grid grid-cols-5 gap-1.5">
              {([["video", "Lecture", Video], ["pdf", "PDF", FileText], ["dpp", "DPP", FileText], ["notes", "Notes", BookOpen], ["test", "Test", ClipboardCheck]] as const).map(([type, label, Icon]) => (
                <Button key={type} size="sm" variant={uploadType === type ? "default" : "outline"} onClick={() => { setUploadType(type as any); if (type === "video" || type === "test") setUploadMode("link"); }} className="text-xs px-2">
                  <Icon className="h-3 w-3 mr-1" /> {label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Content title" />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder="Brief description..." rows={2} />
            </div>

            {/* Link vs File toggle */}
            {uploadType !== "video" && uploadType !== "test" && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant={uploadMode === "link" ? "default" : "outline"} onClick={() => setUploadMode("link")}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Paste Link
                </Button>
                <Button size="sm" variant={uploadMode === "file" ? "default" : "outline"} onClick={() => setUploadMode("file")}>
                  <Upload className="h-3 w-3 mr-1" /> Upload File
                </Button>
              </div>
            )}

            {/* URL Input */}
            {(uploadMode === "link" || uploadType === "video" || uploadType === "test") && (
              <div className="space-y-2">
                <Label>{uploadType === "video" ? "Video URL" : uploadType === "test" ? "Test URL" : "Content URL"}</Label>
                <Input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}

            {/* File Upload */}
            {uploadMode === "file" && uploadType !== "test" && (
              <div className="space-y-2">
                <Label>{uploadType === "video" ? "Video File" : "File"}</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept={uploadType === "video" ? ".mp4,.webm,.mov" : ".pdf,.doc,.docx"}
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="drilldown-file-upload"
                  />
                  <label htmlFor="drilldown-file-upload" className="cursor-pointer">
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium text-sm">{uploadFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm">Click to upload</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleInlineUpload} disabled={isUploading}>
              {isUploading ? <Clock className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              Publish Content
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContentDrillDown;
