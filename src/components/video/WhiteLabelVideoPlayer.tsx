import { useState, useCallback, useRef, useEffect } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareModal from "./ShareModal";
import EndScreenOverlay from "./EndScreenOverlay";
import sadguruLogo from "@/assets/branding/logo_icon_web.png";

interface WhiteLabelVideoPlayerProps {
  videoUrl?: string;
  videoId?: string;
  onEnded?: () => void;
  onReady?: () => void;
  onDurationReady?: (duration: number) => void;
  nextVideoUrl?: string;
  nextVideoTitle?: string;
  onNextVideo?: () => void;
  showShareButton?: boolean;
}

/**
 * WhiteLabelVideoPlayer - Fully branded YouTube player for Sadguru Coaching Classes
 * 
 * Features:
 * - Hides all YouTube branding (Share, Logo, Watch on YouTube)
 * - Custom Sadguru Coaching Classes watermark
 * - Custom share modal (WhatsApp, Facebook, Twitter, Copy Link)
 * - Custom end screen overlay
 * - Anti-piracy: blocks right-click, long-press, context menu
 */
const WhiteLabelVideoPlayer = ({
  videoUrl,
  videoId,
  onEnded,
  onReady,
  onDurationReady,
  nextVideoUrl,
  nextVideoTitle,
  onNextVideo,
  showShareButton = true,
}: WhiteLabelVideoPlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string | null => {
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

  const youtubeId = videoId || (videoUrl ? extractYouTubeId(videoUrl) : null);

  // Block context menu
  const preventContextMenu = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Setup anti-piracy event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('contextmenu', preventContextMenu, { passive: false });
    
    let touchTimer: ReturnType<typeof setTimeout>;
    const handleTouchStart = () => {
      touchTimer = setTimeout(() => {
        // Long-press detected - do nothing (block context menu)
      }, 500);
    };
    
    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      clearTimeout(touchTimer);
    };
  }, [preventContextMenu]);

  // YouTube API message listener for video end detection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube-nocookie.com' && 
          event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Check for player state change (0 = ended)
        if (data.event === 'onStateChange' && data.info === 0) {
          setShowEndScreen(true);
          onEnded?.();
        }
        
        // Check for duration info
        if (data.event === 'infoDelivery' && data.info?.duration) {
          onDurationReady?.(data.info.duration);
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded, onDurationReady]);

  const handleReplay = () => {
    setShowEndScreen(false);
    // Reload iframe to replay
    if (playerRef.current) {
      const src = playerRef.current.src;
      playerRef.current.src = '';
      playerRef.current.src = src;
    }
  };

  const handleNextVideo = () => {
    setShowEndScreen(false);
    onNextVideo?.();
  };

  // YouTube embed URL with all branding minimization parameters
  const embedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&playsinline=1&controls=1&fs=1&origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1&widget_referrer=${encodeURIComponent(window.location.href)}`
    : null;

  if (!youtubeId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative rounded-xl overflow-hidden shadow-2xl bg-black white-label-player select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      <div className="aspect-video relative">
        {/* Loading spinner */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-[#ff9b00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* YouTube iframe - NO web-share in allow attribute */}
        <iframe
          ref={playerRef}
          src={embedUrl}
          title="Sadguru Coaching Classes Video Player"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full border-0"
          onLoad={() => {
            setIsLoaded(true);
            onReady?.();
          }}
        />

        {/* ========== OVERLAY BLOCKERS ========== */}
        
        {/* Top-left blocker: Channel watermark/logo area */}
        <div 
          className="absolute top-0 left-0 w-48 h-14 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Top-right blocker: More options area */}
        <div 
          className="absolute top-0 right-0 w-24 h-14 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Bottom blocker: Full-width bar covering share button & YouTube logo */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[60px] z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* ========== SADGURU COACHING CLASSES BRANDING ========== */}

        {/* Custom Share Button - Top Right */}
        {showShareButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-40 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full h-10 w-10"
            onClick={(e) => {
              e.stopPropagation();
              setShareModalOpen(true);
            }}
          >
            <Share2 className="h-5 w-5 text-white" />
          </Button>
        )}

         {/* Sadguru Coaching Classes Watermark - Bottom right, on top of blocker */}
         <div 
           className="sadguru-watermark absolute z-[45] flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg select-none"
           style={{
             right: '10px',
             bottom: '16px',
             pointerEvents: 'none',
           }}
         >
           <img 
             src={sadguruLogo} 
             alt="" 
             className="h-8 w-8 rounded"
             draggable={false}
           />
           <span className="text-white text-sm font-semibold tracking-wide">
             Sadguru Coaching Classes
           </span>
         </div>

        {/* End Screen Overlay - covers everything when video ends */}
        {showEndScreen && (
          <EndScreenOverlay
            onReplay={handleReplay}
            onNextVideo={nextVideoUrl ? handleNextVideo : undefined}
            nextVideoTitle={nextVideoTitle}
          />
        )}
      </div>

      {/* Saffron accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff9b00] to-[#ff6b00] opacity-80 z-20" />

      {/* Share Modal */}
      <ShareModal 
        open={shareModalOpen} 
        onOpenChange={setShareModalOpen}
        title="Share this lesson"
      />
    </div>
  );
};

export default WhiteLabelVideoPlayer;
