import React, { useRef } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

export interface StudentVideoPlayerProps {
  /** YouTube video ID (`v=` param) */
  videoId: string;
  /** Accent colour for all controls – defaults to saffron/orange */
  accentColor?: string;
}

const DEFAULT_COLOUR = '#ff9b00';

// Minimal study-friendly controls only - no share, no pip, no captions toggle
const CONTROL_SET = [
  'play-large',
  'play',
  'progress',
  'current-time',
  'mute',
  'volume',
  'fullscreen',
];

const StudentVideoPlayer: React.FC<StudentVideoPlayerProps> = ({
  videoId,
  accentColor = DEFAULT_COLOUR,
}) => {
  const ref = useRef<any>(null);

  // Extract YouTube ID if full URL is provided
  const extractYouTubeId = (input: string): string => {
    if (!input) return '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return input;
  };

  const cleanVideoId = extractYouTubeId(videoId);

  const plyrProps = {
    source: {
      type: 'video' as const,
      sources: [
        {
          src: cleanVideoId,
          provider: 'youtube' as const,
        },
      ],
    },
    options: {
      controls: CONTROL_SET,
      clickToPlay: true,
      disableContextMenu: true,
      hideYouTubeDOMError: true,
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        iv_load_policy: 3, // Hide annotations
        playsinline: 1,
        fs: 1,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        enablejsapi: 1,
        end: 0, // Disable end screen suggestions
      },
    },
  };

  return (
    <div
      aria-label="Course video player"
      className="rounded-xl overflow-hidden shadow-2xl bg-black group relative student-video-player select-none"
      style={{ 
        '--plyr-color-main': accentColor,
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="aspect-video">
        <Plyr ref={ref} {...plyrProps} />
      </div>
      
      {/* Top overlay to block YouTube branding/share button zone */}
      <div 
        className="absolute top-0 left-0 right-0 h-14 z-30 pointer-events-auto"
        style={{ background: 'transparent' }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Saffron accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff9b00] to-[#ff6b00] opacity-80 z-10" />
    </div>
  );
};

export default StudentVideoPlayer;

export const createThemedPlayer = (accentColor: string) =>
  function ThemedPlayer(props: Omit<StudentVideoPlayerProps, 'accentColor'>) {
    return <StudentVideoPlayer {...props} accentColor={accentColor} />;
  };

export const SaffronPlayer = createThemedPlayer('#ff9b00');
