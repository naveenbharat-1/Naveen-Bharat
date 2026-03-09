import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  onTick?: (remaining: number) => void;
}

const QuizTimer = ({ totalSeconds, onTimeUp, onTick }: QuizTimerProps) => {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 300; // 5 minutes warning
  const isCritical = remaining <= 60;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-semibold border",
        isCritical
          ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
          : isWarning
          ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
          : "bg-primary/10 text-primary border-primary/20"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

export default QuizTimer;
