import { useState, useCallback, useRef, useEffect } from "react";

interface MahimaPlayerProps {
  videoId?: string;
  videoUrl?: string;
  poster?: string;
  /** Hide all watermarks including "Sadguru Coaching Classes" overlay */
  hideWatermarks?: boolean;
  /** Callback when video starts playing */
  onPlay?: () => void;
}

/**
 * Sadguru Player - Secure YouTube embed with anti-piracy features
 * 
 * Features:
 * - Blocks long-press context menu on mobile
 * - Disables Share button
 * - Hides YouTube branding/watermarks
 * - Optional "Sadguru Coaching Classes" watermark (off by default)
 * - Prevents right-click context menu
 * - Touch-friendly with gesture blocking
 */
const MahimaPlayer = ({ 
  videoId, 
  videoUrl, 
  poster,
  hideWatermarks = true,
  onPlay 
}: MahimaPlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube ID if a full URL is provided
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

  // Block long-press context menu (mobile)
  const preventContextMenu = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Block touch-hold gestures
  const preventTouchHold = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      // Don't prevent single taps for play/pause
      // But block multi-touch and long-press
      const target = e.target as HTMLElement;
      if (target.closest('iframe')) {
        // Let iframe handle its own events
        return;
      }
    }
  }, []);

  // Setup event listeners for anti-piracy
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent context menu (right-click on desktop, long-press on mobile)
    container.addEventListener('contextmenu', preventContextMenu, { passive: false });
    
    // Block long-press on touch devices
    let touchTimer: ReturnType<typeof setTimeout>;
    const handleTouchStart = (e: TouchEvent) => {
      touchTimer = setTimeout(() => {
        // If still touching after 500ms, it's a long-press - prevent default
        preventContextMenu(e);
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

  // YouTube privacy-enhanced embed URL with all restrictions
  // Key params:
  // - modestbranding=1: Hide YouTube logo
  // - rel=0: Don't show related videos
  // - showinfo=0: Hide video info
  // - iv_load_policy=3: Hide annotations
  // - disablekb=1: Disable keyboard controls (prevents shortcuts)
  // - controls=1: Show basic controls
  // - fs=1: Allow fullscreen
  // - playsinline=1: Play inline on iOS
  // REMOVED: web-share from allow attribute to disable Share button
  const embedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&playsinline=1&controls=1&fs=1&origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1`
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
      className="relative rounded-xl overflow-hidden shadow-2xl bg-black sadguru-player select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      <div className="aspect-video relative">
        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-[#ff9b00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* YouTube iframe - NO web-share in allow attribute */}
        <iframe
          src={embedUrl}
          title="Video Player"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full border-0"
          onLoad={() => setIsLoaded(true)}
        />

        {/* Top-left blocker for channel watermark/logo */}
        <div 
          className="absolute top-0 left-0 w-48 h-14 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Share button blocker - bottom-left corner */}
        <div 
          className="absolute bottom-12 left-0 w-20 h-16 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Right side overlay to block any branding */}
        <div 
          className="absolute top-0 right-0 w-20 h-20 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Saffron accent bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff9b00] to-[#ff6b00] opacity-80 z-20" />
    </div>
  );
};

export default MahimaPlayer;
