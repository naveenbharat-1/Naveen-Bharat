import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronRight } from "lucide-react";
import sadguruLogo from "@/assets/branding/logo_icon_web.png";

interface EndScreenOverlayProps {
  onReplay: () => void;
  onNextVideo?: () => void;
  nextVideoTitle?: string;
}

/**
 * EndScreenOverlay - Custom end screen that completely covers YouTube's end screen
 * 
 * Key features:
 * - z-index: 2147483647 (maximum) to ensure it covers ALL YouTube elements
 * - Solid black background - no transparency to prevent YouTube UI from showing through
 * - Blocks all click events on YouTube's end-screen elements
 * - Shows Sadguru Coaching Classes branding instead of YouTube logo
 */
const EndScreenOverlay = ({ 
  onReplay, 
  onNextVideo, 
  nextVideoTitle 
}: EndScreenOverlayProps) => {
  return (
    <div 
      className="mahima-end-screen absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-300"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647, // Maximum z-index to cover ALL YouTube elements
        background: '#000', // Solid black - no transparency
        pointerEvents: 'auto', // Capture all events
      }}
    >
       {/* Sadguru Coaching Classes Branding */}
       <div className="flex items-center gap-3 mb-8">
         <img 
           src={sadguruLogo} 
           alt="Sadguru Coaching Classes" 
           className="h-12 w-12 rounded-lg shadow-lg"
           draggable={false}
         />
         <div className="text-white">
           <h3 className="text-xl font-bold">Sadguru Coaching Classes</h3>
           <p className="text-sm text-white/70">More lessons await you!</p>
        </div>
      </div>

      {/* Action Buttons - NO YouTube logo, NO link icon */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Replay Button */}
        <Button
          size="lg"
          onClick={(e) => { e.stopPropagation(); onReplay(); }}
          className="bg-white text-black hover:bg-white/90 font-semibold px-8 gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Replay
        </Button>

        {/* Next Video Button */}
        {onNextVideo && nextVideoTitle && (
          <Button
            size="lg"
            onClick={(e) => { e.stopPropagation(); onNextVideo(); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 gap-2"
          >
            Next: {nextVideoTitle.length > 20 ? nextVideoTitle.slice(0, 20) + '...' : nextVideoTitle}
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Saffron accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff9b00] via-[#ff6b00] to-[#ff9b00]" />
    </div>
  );
};

export default EndScreenOverlay;
