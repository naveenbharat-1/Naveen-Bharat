import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

export interface SecureVideoPlayerProps {
  /** YouTube video URL or ID */
  videoUrl: string;
  /** User's email for watermark */
  userEmail: string;
  /** User's ID for additional security */
  userId: string;
  /** Optional accent color */
  accentColor?: string;
}

const DEFAULT_ACCENT = '#ff9b00';

// Minimal controls for focused learning
const CONTROL_SET = [
  'play-large',
  'play',
  'progress',
  'current-time',
  'mute',
  'volume',
  'fullscreen',
];

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  videoUrl,
  userEmail,
  userId,
  accentColor = DEFAULT_ACCENT,
}) => {
  const ref = useRef<any>(null);
  const [watermarkPositions, setWatermarkPositions] = useState<{ top: string; left: string }[]>([]);

  // Extract YouTube ID from various URL formats
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

  // Generate random watermark positions for anti-piracy
  useEffect(() => {
    const generatePositions = () => {
      const positions = [];
      // Create 4-6 watermarks at random positions
      const count = Math.floor(Math.random() * 3) + 4;
      for (let i = 0; i < count; i++) {
        positions.push({
          top: `${Math.floor(Math.random() * 70) + 10}%`,
          left: `${Math.floor(Math.random() * 60) + 15}%`,
        });
      }
      setWatermarkPositions(positions);
    };

    generatePositions();
    
    // Regenerate positions every 30 seconds to make screen recording harder
    const interval = setInterval(generatePositions, 30000);
    return () => clearInterval(interval);
  }, []);

  const cleanVideoId = extractYouTubeId(videoUrl);

  // Mask email for privacy but keep it identifiable
  const maskEmail = (email: string): string => {
    if (!email) return 'Student';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length > 3 
      ? `${name.slice(0, 2)}***${name.slice(-1)}`
      : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  };

  const maskedEmail = maskEmail(userEmail);
  const shortId = userId ? userId.slice(-6) : '';

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
      disableContextMenu: true, // Disable right-click
      hideYouTubeDOMError: true,
      youtube: {
        noCookie: true, // Privacy-enhanced mode
        rel: 0, // Don't show related videos
        showinfo: 0,
        modestbranding: 1,
        iv_load_policy: 3, // Hide annotations
        playsinline: 1,
        fs: 1,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        enablejsapi: 1,
        // Disable end screen suggestions
        end: 0,
      },
    },
  };

  if (!cleanVideoId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return (
    <div
      aria-label="Course video player"
      className="rounded-xl overflow-hidden shadow-2xl bg-black group relative secure-video-player select-none"
      style={{ '--plyr-color-main': accentColor } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click
    >
      <div className="aspect-video relative">
        <Plyr ref={ref} {...plyrProps} />
        
        {/* Floating Ghost Watermarks - Anti-Piracy Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
          style={{ userSelect: 'none' }}
        >
          {watermarkPositions.map((pos, index) => (
            <div
              key={index}
              className="absolute text-white/10 text-xs font-medium whitespace-nowrap transform -rotate-12 select-none"
              style={{
                top: pos.top,
                left: pos.left,
                textShadow: '0 0 2px rgba(0,0,0,0.3)',
              }}
            >
              {maskedEmail} | {shortId}
            </div>
          ))}
          
          {/* Static corner watermark */}
          <div className="absolute top-4 right-4 text-white/20 text-sm font-semibold pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Sadguru Coaching Classes
          </div>
          
          {/* Bottom watermark always visible */}
          <div className="absolute bottom-16 left-4 text-white/15 text-xs font-medium pointer-events-none select-none">
            Licensed to: {maskedEmail}
          </div>
        </div>
      </div>
      
      {/* Saffron accent bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 opacity-80 z-10"
        style={{ background: `linear-gradient(to right, ${accentColor}, #ff6b00)` }}
      />
      
      {/* Anti-screen-capture overlay that appears when not playing */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
};

export default SecureVideoPlayer;
