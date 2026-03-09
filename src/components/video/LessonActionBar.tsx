import { memo } from "react";
import { ThumbsUp, HelpCircle, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LessonActionBarProps {
  likeCount: number;
  hasLiked: boolean;
  onLike: () => void;
  onDoubts: () => void;
  onComments?: () => void;
  onDownloadPdf?: () => void;
  hasPdf: boolean;
  likesLoading?: boolean;
  lessonTitle?: string;
  teacherName?: string;
  courseInfo?: string;
}

const LessonActionBar = memo(({
  likeCount,
  hasLiked,
  onLike,
  onDoubts,
  onDownloadPdf,
  hasPdf,
  likesLoading,
  lessonTitle,
  courseInfo,
}: LessonActionBarProps) => {
  return (
    <div className="border-b border-border bg-card">
      {/* Action buttons row — 2 large pill buttons matching reference screenshot */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Like Button — large pill */}
        <Button
          variant="outline"
          className={cn(
            "flex-1 gap-2 h-11 text-sm font-semibold rounded-full transition-all border-2",
            hasLiked
              ? "bg-primary/10 border-primary text-primary"
              : "border-border text-foreground"
          )}
          onClick={onLike}
          disabled={likesLoading}
        >
          <ThumbsUp className={cn("h-4 w-4", hasLiked && "fill-primary")} />
          {likeCount > 0 ? `${likeCount} Likes` : "Like"}
        </Button>

        {/* Doubts Button — large pill */}
        <Button
          variant="outline"
          className="flex-1 gap-2 h-11 text-sm font-semibold rounded-full border-2 border-border text-foreground"
          onClick={onDoubts}
        >
          <HelpCircle className="h-4 w-4 text-amber-500" />
          Doubts
        </Button>
      </div>

      {/* PDF / Download row — shown below if PDF exists */}
      {hasPdf && onDownloadPdf && (
        <div className="flex items-center gap-3 px-4 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={onDownloadPdf}
          >
            <FileText className="h-3.5 w-3.5" />
            Class PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (onDownloadPdf) onDownloadPdf();
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
});

LessonActionBar.displayName = "LessonActionBar";

export default LessonActionBar;
