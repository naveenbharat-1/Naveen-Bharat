import { useState } from "react";

interface PlyrPlayerProps {
  videoId: string;
  poster?: string;
}

/**
 * Saffron-themed YouTube player
 * Uses privacy-enhanced YouTube embed with custom styling
 * Features: Orange/Bhagwa progress indication, minimal branding, watermark overlay
 */
const PlyrPlayer = ({ videoId, poster }: PlyrPlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // YouTube privacy-enhanced embed URL - completely distraction-free
  // Parameters: no related videos, no annotations, no branding, no info bar, no end screen suggestions
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&playsinline=1&controls=1&disablekb=0&fs=1&loop=0&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.origin)}&enablejsapi=1`;

  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-2xl bg-black group sadguru-player select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      <div className="aspect-video">
        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-[#ff9b00] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* YouTube iframe - NO web-share permission */}
        <iframe
          src={embedUrl}
          title="Sadguru Coaching Classes Video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full border-0"
          onLoad={() => setIsLoaded(true)}
        />
        
        {/* Overlay to block YouTube branding and share button zone */}
        <div 
          className="absolute top-0 left-0 right-0 h-16 z-30 pointer-events-auto"
          style={{ background: 'transparent' }}
          onClick={(e) => e.stopPropagation()} 
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Right corner overlay to block Share button */}
        <div 
          className="absolute top-0 right-0 w-24 h-20 z-30 pointer-events-auto"
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

export default PlyrPlayer;
