import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, FileText, FolderOpen, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDownloads, type DownloadRecord } from "@/hooks/useDownloads";
import { toast } from "sonner";
import PdfViewer from "@/components/video/PdfViewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fileTypeBadgeClass: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-600 dark:text-red-400",
  NOTES: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DPP: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Downloads = () => {
  const navigate = useNavigate();
  const { downloads, loading, deleteDownload } = useDownloads();
  const [search, setSearch] = useState("");
  const [openFile, setOpenFile] = useState<DownloadRecord | null>(null);

  const filtered = downloads.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.fileType.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number | undefined, title: string) => {
    if (id === undefined) return;
    await deleteDownload(id);
    toast.success(`"${title}" removed from downloads`);
  };

  if (openFile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b h-14 flex items-center px-4 sticky top-0 z-30 shadow-sm gap-3">
          <Button variant="ghost" size="icon" onClick={() => setOpenFile(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground truncate flex-1">{openFile.title}</span>
          <Badge className={fileTypeBadgeClass[openFile.fileType] || "bg-muted text-muted-foreground"}>
            {openFile.fileType}
          </Badge>
        </header>
        <div className="flex-1 p-0">
          <PdfViewer url={openFile.url} title={openFile.title} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b h-14 flex items-center px-4 sticky top-0 z-30 shadow-sm gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Download className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-foreground text-base">My Downloads</h1>
          {downloads.length > 0 && (
            <Badge variant="secondary" className="text-xs">{downloads.length}</Badge>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Search */}
        {downloads.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search downloads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && downloads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">No downloads yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Download PDFs, Notes, or DPPs from lesson pages and they'll appear here for quick access.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/my-courses")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse My Courses
            </Button>
          </div>
        )}

        {/* No search results */}
        {!loading && downloads.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No downloads matching "{search}"
          </div>
        )}

        {/* Downloads List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors group"
              >
                {/* Icon */}
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-4 ${fileTypeBadgeClass[item.fileType] || "bg-muted text-muted-foreground"}`}
                    >
                      {item.fileType}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(item.downloadedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-primary hover:bg-primary/10 text-xs"
                    onClick={() => setOpenFile(item)}
                  >
                    Open
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from downloads?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{item.title}" will be removed from your downloads history. The original file is not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => handleDelete(item.id, item.title)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Downloads;
