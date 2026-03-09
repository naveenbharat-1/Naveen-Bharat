import { useState } from "react";

interface SaffronPlayerProps {
  videoId?: string;
  videoUrl?: string;
  poster?: string;
}

/**
 * Saffron-themed video player
 * Supports YouTube embeds and direct video URLs
 * Features: Orange/Bhagwa theme, minimal branding, watermark overlay
 */
const SaffronPlayer = ({ videoId, videoUrl, poster }: SaffronPlayerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Extract YouTube ID if a full URL is provided
  const extractYouTubeId = (url: string): string | null => {
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
  const isYouTube = !!youtubeId;

  // YouTube privacy-enhanced embed URL
  const embedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=white&playsinline=1`
    : null;

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

        {/* YouTube embed - NO web-share permission */}
        {isYouTube && embedUrl && (
          <iframe
            src={embedUrl}
            title="Video Player"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
            onLoad={() => setIsLoaded(true)}
          />
        )}

        {/* HTML5 Video for direct URLs */}
        {!isYouTube && videoUrl && (
          <video
            src={videoUrl}
            poster={poster}
            controls
            controlsList="nodownload"
            className="w-full h-full saffron-video"
            onLoadedData={() => setIsLoaded(true)}
            style={{ accentColor: "#ff9b00" }}
            onContextMenu={(e) => e.preventDefault()}
          >
            Your browser does not support video playback.
          </video>
        )}

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

export default SaffronPlayer;
