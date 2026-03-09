import { useState, useEffect, lazy, Suspense } from "react";
import { ChevronLeft, FileText, MessageCircle, Download, Eye, ChevronUp, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MahimaGhostPlayer } from "@/components/video";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";

const DriveEmbedViewer = lazy(() => import("@/components/course/DriveEmbedViewer"));

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    video_url: string;
    description?: string | null;
    youtube_id?: string | null;
  } | null;
  userId?: string;
}

export const LectureModal = ({ isOpen, onClose, lesson, userId }: LectureModalProps) => {
  const [noteContent, setNoteContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { profile } = useAuth();
  const { comments, loading: commentsLoading, createComment } = useComments(lesson?.id);

  // Extract YouTube ID from URL
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeId = lesson?.youtube_id || (lesson?.video_url ? getYouTubeId(lesson.video_url) : null);

  // Load notes from database
  useEffect(() => {
    const loadNotes = async () => {
      if (!lesson?.id || !userId) {
        // Fall back to localStorage if no user
        const saved = localStorage.getItem(`lecture_note_${lesson?.id}`);
        if (saved) setNoteContent(saved);
        return;
      }

      const { data } = await supabase
        .from("lecture_notes")
        .select("markdown")
        .eq("lesson_id", lesson.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.markdown) {
        setNoteContent(data.markdown);
      } else {
        // Check localStorage as fallback
        const saved = localStorage.getItem(`lecture_note_${lesson.id}`);
        if (saved) setNoteContent(saved);
      }
    };

    if (isOpen && lesson) {
      loadNotes();
    }
  }, [isOpen, lesson?.id, userId]);

  // Auto-save notes
  useEffect(() => {
    if (!lesson?.id || !noteContent) return;

    const timer = setTimeout(async () => {
      // Save to localStorage immediately
      localStorage.setItem(`lecture_note_${lesson.id}`, noteContent);

      // Save to database if logged in
      if (userId) {
        setIsSaving(true);
        try {
          await supabase.from("lecture_notes").upsert({
            lesson_id: lesson.id,
            user_id: userId,
            markdown: noteContent,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "lesson_id,user_id"
          });
        } catch (err) {
          console.error("Failed to save notes:", err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [noteContent, lesson?.id, userId]);

  // Download notes as PDF (HTML)
  const handleDownloadNotes = () => {
    if (!noteContent.trim()) {
      toast.error("No notes to download");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Notes - ${lesson?.title || 'Lecture Notes'}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
          pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
          .timestamp { color: #666; font-size: 12px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <h1>📝 ${lesson?.title || 'Lecture Notes'}</h1>
        <div style="white-space: pre-wrap;">${noteContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p class="timestamp">Downloaded: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${lesson?.title?.replace(/\s+/g, '_') || 'lecture'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded!");
  };

  if (!isOpen || !lesson) return null;

  // Detect content types
  const isDocEmbed = /drive\.google\.com/.test(lesson.video_url)
    || /\.pdf($|\?)/i.test(lesson.video_url)
    || /archive\.org/.test(lesson.video_url);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-foreground line-clamp-1 flex-1">
          {lesson.title}
        </h1>
      </header>

      {/* Video / Drive / Archive Player */}
      <div 
        className={cn(
          "relative bg-black w-full mahima-player select-none",
          isDocEmbed ? "flex-1 min-h-0" : "max-h-[60vh]"
        )}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
      >
        {isDocEmbed ? (
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <DriveEmbedViewer url={lesson.video_url} title={lesson.title} />
          </Suspense>
        ) : youtubeId ? (
          <MahimaGhostPlayer
            videoUrl={lesson.video_url}
            title={lesson.title}
            lessonId={lesson.id}
            onReady={() => console.log('Video ready in modal')}
          />
        ) : /vimeo\.com/.test(lesson.video_url) ? (
          <div className="aspect-video w-full">
            <iframe
              src={`https://player.vimeo.com/video/${lesson.video_url.match(/vimeo\.com\/(\d+)/)?.[1] || ''}`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        ) : /\.(mp4|webm)($|\?)/i.test(lesson.video_url) ? (
          <video
            src={lesson.video_url}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onContextMenu={(e) => e.preventDefault()}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Unsupported format
          </div>
        )}
      </div>

      {/* Collapsible Notes Section - Hidden for PDF/Drive/Archive content */}
      {!isDocEmbed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-4 py-3 bg-muted/50 border-y hover:bg-muted/80 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Show Notes & Description
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Tabs Content */}
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="notes" className="h-full flex flex-col">
                <TabsList className="mx-4 mt-3 justify-start gap-2 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="notes" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Smart Notes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="discussion"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Discussion
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="flex-1 overflow-hidden mt-0 px-4 py-4">
                  <div className="bg-card rounded-xl border p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Smart Notes</span>
                        {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleDownloadNotes} className="text-muted-foreground">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsPreview(!isPreview)} className="text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      {isPreview ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {noteContent || "No notes yet..."}
                        </div>
                      ) : (
                        <Textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder={`# My Notes\n\nWrite your notes here using Markdown...\n\n**Bold text**, *italic text*, \`inline code\`\n\n- Bullet points`}
                          className="min-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent"
                        />
                      )}
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground mt-3">
                      Supports Markdown: **bold**, *italic*, `code`, # headings, - lists
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="flex-1 overflow-hidden mt-0 px-4 py-4">
                  <div className="bg-card rounded-xl border p-4 h-full flex flex-col">
                    {/* Comment input */}
                    <div className="flex gap-2 mb-4">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[60px] resize-none flex-1"
                      />
                      <Button
                        size="icon"
                        className="shrink-0 self-end"
                        disabled={!commentText.trim()}
                        onClick={async () => {
                          if (!lesson?.id || !commentText.trim()) return;
                          const ok = await createComment({ lessonId: lesson.id, message: commentText.trim() });
                          if (ok) setCommentText("");
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Comments list */}
                    <ScrollArea className="flex-1">
                      {commentsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6 text-sm">No comments yet. Be the first!</p>
                      ) : (
                        <div className="space-y-3">
                          {comments.map((c) => (
                            <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">{c.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LectureModal;
