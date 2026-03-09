import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  BookOpen, Layers, Video, FileText, Trash2, Plus, Loader2, 
  LogOut, ChevronLeft, Upload
} from "lucide-react";


// ====== TYPES ======
interface Course {
  id: number;
  title: string;
  grade: string | null;
}

interface Chapter {
  id: string;
  code: string;
  title: string;
  course_id: number;
  position: number;
}

interface Lesson {
  id: string;
  title: string;
  video_url: string;
  lecture_type: string;
  chapter_id: string | null;
  course_id: number | null;
  position: number;
}

// ====== MAIN COMPONENT ======
const AdminCMS = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCourse, setNewCourse] = useState({ title: "", grade: "", description: "", price: "" });
  const [newChapter, setNewChapter] = useState({ courseId: "", code: "", title: "" });
  const [newLecture, setNewLecture] = useState({ 
    chapterId: "", title: "", youtubeUrl: "", lectureType: "VIDEO" as "VIDEO" | "PDF" | "DPP" | "NOTES"
  });

  // ====== AUTH CHECK ======
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
    } else if (!authLoading && user && !isAdmin) {
      toast.error("Admin privileges required.");
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // ====== FETCH DATA ======
  useEffect(() => {
    if (user && isAdmin) fetchAllData();
  }, [user, isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [coursesRes, chaptersRes, lessonsRes] = await Promise.all([
        supabase.from("courses").select("id, title, grade").order("title"),
        supabase.from("chapters").select("*").order("position"),
        supabase.from("lessons").select("id, title, video_url, lecture_type, chapter_id, course_id, position").order("position")
      ]);

      setCourses(coursesRes.data || []);
      setChapters(chaptersRes.data || []);
      setLessons((lessonsRes.data || []).map(l => ({
        ...l,
        lecture_type: l.lecture_type || "VIDEO",
        position: l.position || 0
      })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ====== COURSE CRUD ======
  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.grade) {
      toast.error("Title and Grade are required");
      return;
    }

    try {
      const { error } = await supabase.from("courses").insert({
        title: newCourse.title,
        grade: newCourse.grade,
        description: newCourse.description || null,
        price: newCourse.price ? parseFloat(newCourse.price) : 0,
        image_url: "https://placehold.co/600x400/png"
      });

      if (error) throw error;
      toast.success("Course created!");
      setNewCourse({ title: "", grade: "", description: "", price: "" });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete this course and all its content?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAllData(); }
  };

  // ====== CHAPTER CRUD ======
  const handleAddChapter = async () => {
    if (!newChapter.courseId || !newChapter.code || !newChapter.title) {
      toast.error("All fields are required");
      return;
    }

    const courseChapters = chapters.filter(c => c.course_id === Number(newChapter.courseId));
    const position = courseChapters.length;

    try {
      const { error } = await supabase.from("chapters").insert({
        course_id: Number(newChapter.courseId),
        code: newChapter.code,
        title: newChapter.title,
        position
      });

      if (error) throw error;
      toast.success("Subject created!");
      setNewChapter({ courseId: newChapter.courseId, code: "", title: "" });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Delete this chapter?")) return;
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAllData(); }
  };

  // ====== LECTURE CRUD ======
  const handleAddLecture = async () => {
    if (!newLecture.chapterId || !newLecture.title) {
      toast.error("Chapter and Title are required");
      return;
    }

    const chapter = chapters.find(c => c.id === newLecture.chapterId);
    if (!chapter) {
      toast.error("Chapter not found");
      return;
    }

    // Extract YouTube ID
    let youtubeId = "";
    if (newLecture.youtubeUrl) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
      ];
      for (const pattern of patterns) {
        const match = newLecture.youtubeUrl.match(pattern);
        if (match) { youtubeId = match[1]; break; }
      }
    }

    const chapterLessons = lessons.filter(l => l.chapter_id === newLecture.chapterId);
    const position = chapterLessons.length + 1;

    try {
      const { error } = await supabase.from("lessons").insert({
        chapter_id: newLecture.chapterId,
        course_id: chapter.course_id,
        title: newLecture.title,
        video_url: newLecture.youtubeUrl || "",
        youtube_id: youtubeId || null,
        lecture_type: newLecture.lectureType,
        position,
        is_locked: true
      });

      if (error) throw error;
      toast.success("Lecture added!");
      setNewLecture({ ...newLecture, title: "", youtubeUrl: "" });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    if (!confirm("Delete this lecture?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAllData(); }
  };

  // ====== RENDER ======
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-primary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-primary">Admin CMS</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="chapters" className="gap-2">
              <Layers className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="lectures" className="gap-2">
              <Video className="h-4 w-4" />
              Lectures
            </TabsTrigger>
          </TabsList>

          {/* ====== COURSES/SUBJECTS TAB ====== */}
          <TabsContent value="courses">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Add Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4" /> Add Subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Code (e.g., Phy, Chem)</Label>
                    <Input
                      placeholder="e.g., Psychology"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Grade/Class</Label>
                    <Input
                      placeholder="e.g., 11"
                      value={newCourse.grade}
                      onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="Course description..."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddCourse} className="w-full">
                    Add Subject
                  </Button>
                </CardContent>
              </Card>

              {/* List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Existing Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {course.title.substring(0, 3).toUpperCase()}
                            </Badge>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              {course.grade && (
                                <p className="text-xs text-muted-foreground">Class {course.grade}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {courses.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No subjects yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== CHAPTERS TAB ====== */}
          <TabsContent value="chapters">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Add Form */}
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4" /> Add Subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Subject</Label>
                    <Select
                      value={newChapter.courseId}
                      onValueChange={(v) => setNewChapter({ ...newChapter, courseId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject Code (e.g., SB-01)</Label>
                    <Input
                      placeholder="CH-01"
                      value={newChapter.code}
                      onChange={(e) => setNewChapter({ ...newChapter, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Subject Title</Label>
                    <Input
                      placeholder="e.g., Introduction to Mind"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddChapter} className="w-full">
                     Add Subject
                  </Button>
                </CardContent>
              </Card>

              {/* List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Existing Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {chapters.map((chapter) => {
                        const course = courses.find((c) => c.id === chapter.course_id);
                        return (
                          <div
                            key={chapter.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {chapter.code}
                              </Badge>
                              <div>
                                <p className="font-medium">{chapter.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {course?.title || "Unknown course"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {chapters.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No subjects yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== LECTURES TAB ====== */}
          <TabsContent value="lectures">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Add Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4" /> Add Lecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Chapter</Label>
                    <Select
                      value={newLecture.chapterId}
                      onValueChange={(v) => setNewLecture({ ...newLecture, chapterId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose chapter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((c) => {
                          const course = courses.find((co) => co.id === c.course_id);
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              {c.code} - {c.title} ({course?.title})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lecture Title</Label>
                    <Input
                      placeholder="e.g., What is Mind"
                      value={newLecture.title}
                      onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>YouTube URL or ID</Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=... or video ID"
                      value={newLecture.youtubeUrl}
                      onChange={(e) => setNewLecture({ ...newLecture, youtubeUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newLecture.lectureType}
                      onValueChange={(v: "VIDEO" | "PDF" | "DPP" | "NOTES") =>
                        setNewLecture({ ...newLecture, lectureType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIDEO">
                          <span className="flex items-center gap-2">
                            <Video className="h-4 w-4" /> Video
                          </span>
                        </SelectItem>
                        <SelectItem value="PDF">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> PDF
                          </span>
                        </SelectItem>
                        <SelectItem value="DPP">
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> DPP (Practice)
                          </span>
                        </SelectItem>
                        <SelectItem value="NOTES">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Notes
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddLecture} className="w-full gap-2">
                    <Upload className="h-4 w-4" />
                    Add Lecture
                  </Button>
                </CardContent>
              </Card>

              {/* List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Existing Lectures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {lessons.map((lesson) => {
                        const chapter = chapters.find((c) => c.id === lesson.chapter_id);
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant="secondary" 
                                className={
                                  lesson.lecture_type === "VIDEO" ? "bg-primary/10 text-primary" :
                                  lesson.lecture_type === "PDF" ? "bg-orange-100 text-orange-600" :
                                  lesson.lecture_type === "DPP" ? "bg-green-100 text-green-600" :
                                  "bg-purple-100 text-purple-600"
                                }
                              >
                                {lesson.lecture_type}
                              </Badge>
                              <div>
                                <p className="font-medium line-clamp-1">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {chapter?.code || "No chapter"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLecture(lesson.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {lessons.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No lectures yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminCMS;
