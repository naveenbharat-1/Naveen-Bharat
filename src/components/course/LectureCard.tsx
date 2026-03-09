import { Play, Lock, ClipboardCheck, CheckCircle2, Circle, FileText, BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import checkmarkIcon from "@/assets/icons/checkmark-3d.png";
import scienceIcon from "@/assets/icons/science-3d.png";

export interface LectureCardProps {
  id: string;
  title: string;
  lectureType: "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST";
  position?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  createdAt?: string | null;
  duration?: number | null;
  onClick?: () => void;
  onMarkComplete?: (e: React.MouseEvent) => void;
  compact?: boolean;
}

const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "—";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd MMM").toUpperCase();
  } catch {
    return "";
  }
};

const isVideoType = (type: string) => type === "VIDEO";
const isNotesType = (type: string) => type === "PDF" || type === "NOTES";
const isTestType = (type: string) => type === "TEST";

// Badge colors per type for compact row
const typeBadgeClass: Record<string, string> = {
  VIDEO:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  PDF:    "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  DPP:    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  NOTES:  "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  TEST:   "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
};

const typeIcon: Record<string, React.ReactNode> = {
  VIDEO:  <Play className="h-3 w-3" />,
  PDF:    <FileText className="h-3 w-3" />,
  DPP:    <ClipboardList className="h-3 w-3" />,
  NOTES:  <BookOpen className="h-3 w-3" />,
  TEST:   <ClipboardCheck className="h-3 w-3" />,
};

const typeLabel: Record<string, string> = {
  VIDEO: "VIDEO",
  PDF:   "PDF",
  DPP:   "DPP",
  NOTES: "NOTES",
  TEST:  "TEST",
};

export const LectureCard = ({
  title,
  lectureType,
  position,
  isLocked = false,
  isCompleted = false,
  createdAt,
  duration,
  onClick,
  onMarkComplete,
  compact = false,
}: LectureCardProps) => {
  const isVideo = isVideoType(lectureType);
  const isNotes = isNotesType(lectureType);
  const isTest = isTestType(lectureType);
  const isMarkable = !isVideo && !isTest;
  const displayTypeLabel = isVideo ? "LECTURE" : lectureType;
  const dateStr = formatDate(createdAt);

  // ── COMPACT / LIST ROW ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/50 cursor-pointer",
          "transition-all hover:bg-muted/40 hover:border-border active:scale-[0.99]",
          isLocked && "opacity-60"
        )}
      >
        {/* Type badge */}
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
          typeBadgeClass[lectureType] ?? typeBadgeClass.VIDEO
        )}>
          {typeIcon[lectureType]}
          {typeLabel[lectureType] ?? lectureType}
        </span>

        {/* Title */}
        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
          {title}
        </span>

        {/* Duration / date */}
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {isVideo ? formatDuration(duration) : (dateStr || "—")}
        </span>

        {/* Completion indicator */}
        <div className="shrink-0 w-6 flex items-center justify-center">
          {isLocked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isMarkable && onMarkComplete ? (
            <button
              onClick={onMarkComplete}
              className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-green-400 transition-colors flex items-center justify-center"
              title="Mark as done"
            >
              <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
            </button>
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/25" />
          )}
        </div>
      </div>
    );
  }

  // ── FULL CARD (default) ─────────────────────────────────────────────────────
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-card rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 cursor-pointer transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
        isLocked && "opacity-60"
      )}
    >
      {/* Completed checkmark - top right */}
      {isCompleted && !isLocked && (
        <img
          src={checkmarkIcon}
          alt="Completed"
          width={20}
          height={20}
          className="absolute top-3 right-3 w-5 h-5 object-contain"
          loading="lazy"
          decoding="async"
        />
      )}

      <div className="flex gap-4">
        {/* Left: Thumbnail or Icon */}
        {isVideo || lectureType === "DPP" || isTest ? (
          <div className="relative min-w-[100px] h-[75px] rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {isLocked ? (
                <Lock className="h-6 w-6 text-white/80" />
              ) : isTest ? (
                <ClipboardCheck className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white fill-white" />
              )}
            </div>
            <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </span>
          </div>
        ) : (
          <div className={cn(
            "min-w-[72px] h-[72px] rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
            isCompleted ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/50"
          )}>
            {isCompleted ? (
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            ) : (
              <img
                src={scienceIcon}
                alt="Notes"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        )}

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium tracking-wide">{displayTypeLabel}</span>
            {dateStr && (
              <>
                <span>·</span>
                <span>{dateStr}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h4 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mt-1">
            {title}
          </h4>

          {/* Action row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                isNotes
                  ? "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-950/50"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {isVideo ? "Watch Lecture" : isTest ? "Take Test" : isNotes ? "View Note" : "View DPP"}
            </button>

            {/* Mark Done button — only for non-video, non-test, not yet completed */}
            {isMarkable && !isCompleted && onMarkComplete && (
              <button
                onClick={onMarkComplete}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Mark Done
              </button>
            )}

            {/* Completed badge for non-video types */}
            {isMarkable && isCompleted && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 flex items-center gap-1 pointer-events-none">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureCard;
