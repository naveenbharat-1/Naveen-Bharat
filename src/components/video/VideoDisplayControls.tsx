import { useState, useCallback, useEffect, useRef } from "react";
import { Maximize2, ZoomIn, ZoomOut, Search } from "lucide-react";

interface VideoDisplayControlsProps {
  onZoomChange: (zoom: number) => void;
  currentZoom: number;
}

const VideoDisplayControls = ({ onZoomChange, currentZoom }: VideoDisplayControlsProps) => {
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  const handleFit = () => { onZoomChange(1); resetHideTimer(); };
  const handleZoomIn = () => { onZoomChange(Math.min(3, currentZoom + 0.1)); resetHideTimer(); };
  const handleZoomOut = () => { onZoomChange(Math.max(0.5, currentZoom - 0.1)); resetHideTimer(); };
  const handleMagnify = () => {
    onZoomChange(currentZoom === 1 ? 1.5 : 1);
    resetHideTimer();
  };

  return (
    <div
      className={`absolute bottom-20 right-3 z-[55] flex flex-col gap-2 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      onTouchStart={resetHideTimer}
      onMouseEnter={resetHideTimer}
    >
      {[
        { icon: Maximize2, onClick: handleFit, label: "Fit" },
        { icon: ZoomIn, onClick: handleZoomIn, label: "+" },
        { icon: ZoomOut, onClick: handleZoomOut, label: "−" },
        { icon: Search, onClick: handleMagnify, label: "🔍" },
      ].map(({ icon: Icon, onClick, label }) => (
        <button
          key={label}
          onClick={onClick}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 active:scale-95 transition-all"
          title={label}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
      {currentZoom !== 1 && (
        <span className="text-white text-[10px] text-center bg-black/60 rounded-full px-2 py-1">
          {Math.round(currentZoom * 100)}%
        </span>
      )}
    </div>
  );
};

export default VideoDisplayControls;
