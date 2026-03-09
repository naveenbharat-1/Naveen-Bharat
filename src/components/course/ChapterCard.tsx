import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChapterCardProps {
  code: string;
  title: string;
  lectureCount: number;
  completedLectures: number;
  dppCount?: number;
  completedDpp?: number;
  onClick?: () => void;
}

export const ChapterCard = ({
  code,
  title,
  lectureCount,
  completedLectures,
  dppCount = 0,
  completedDpp = 0,
  onClick,
}: ChapterCardProps) => {
  const isComplete = lectureCount > 0 && completedLectures >= lectureCount;
  const progressPct = lectureCount > 0 ? Math.round((completedLectures / lectureCount) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer transition-all overflow-hidden",
        "hover:shadow-md hover:border-primary/20",
        isComplete && "border-green-500/30 hover:border-green-500/50"
      )}
    >
      {/* Chapter Badge */}
      <div className={cn(
        "min-w-[64px] h-[52px] rounded-xl flex items-center justify-center",
        isComplete ? "bg-green-500/10" : "bg-primary/10"
      )}>
        {isComplete
          ? <CheckCircle2 className="h-6 w-6 text-green-600" />
          : <span className="text-primary font-semibold text-sm">{code}</span>
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground line-clamp-1">{title}</h3>
        <p className={cn(
          "text-sm mt-0.5",
          isComplete ? "text-green-600 font-medium" : "text-muted-foreground"
        )}>
          {isComplete
            ? `✓ All ${lectureCount} lessons done`
            : `Progress : ${completedLectures}/${lectureCount}`
          }
          {!isComplete && dppCount > 0 && ` • DPP : ${completedDpp}/${dppCount}`}
        </p>
      </div>

      {/* Right icon */}
      {isComplete
        ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      }

      {/* Progress bar at bottom */}
      {lectureCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border">
          <div
            className={cn("h-full transition-all duration-500", isComplete ? "bg-green-500" : "bg-primary")}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ChapterCard;
