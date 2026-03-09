import React, { useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export interface GhostWatermarkPlayerProps {
  videoUrl: string;
  onVideoEnd?: () => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
}

interface WatermarkPosition {
  top: string;
  left: string;
  opacity: number;
}

const GhostWatermarkPlayer: React.FC<GhostWatermarkPlayerProps> = ({
  videoUrl,
  onVideoEnd,
  onProgress,
}) => {
  const { user, profile } = useAuth();
  const [watermarkPositions, setWatermarkPositions] = useState<WatermarkPosition[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [watermarkFaded, setWatermarkFaded] = useState(false);

  const extractYouTubeId = useCallback((input: string): string | null => {
    if (!input) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, []);

  const generateWatermarkPositions = useCallback(() => {
    const positions: WatermarkPosition[] = [];
    const count = Math.floor(Math.random() * 3) + 5;
    for (let i = 0; i < count; i++) {
      positions.push({
        top: `${Math.floor(Math.random() * 60) + 15}%`,
        left: `${Math.floor(Math.random() * 50) + 20}%`,
        opacity: Math.random() * 0.08 + 0.04,
      });
    }
    setWatermarkPositions(positions);
  }, []);

  useEffect(() => {
    generateWatermarkPositions();
    const interval = setInterval(() => {
      generateWatermarkPositions();
    }, 25000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [generateWatermarkPositions]);

  // Fade watermark after 7 seconds of playback
  useEffect(() => {
    if (playedSeconds >= 7 && !watermarkFaded) {
      setWatermarkFaded(true);
    }
  }, [playedSeconds, watermarkFaded]);

  // Reset fade when video restarts
  useEffect(() => {
    if (playedSeconds < 1) {
      setWatermarkFaded(false);
    }
  }, [playedSeconds]);

  const getMaskedEmail = (): string => {
    const email = user?.email || profile?.email;
    if (!email) return 'Student';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length > 3
      ? `${name.slice(0, 2)}***${name.slice(-1)}`
      : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  };

  const getShortId = (): string => {
    const userId = user?.id != null ? String(user.id) : '';
    return userId ? userId.slice(-8).toUpperCase() : '';
  };

  const videoId = extractYouTubeId(videoUrl);
  const maskedEmail = getMaskedEmail();
  const shortId = getShortId();

  const watermarkOpacity = watermarkFaded ? 0.05 : 0.15;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayedSeconds(state.playedSeconds);
    onProgress?.(state);
  };

  if (!videoId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Video not available</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-2xl bg-black select-none"
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none' }}
    >
      {!isReady && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      <div className="aspect-video relative">
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls
          onReady={() => setIsReady(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onVideoEnd}
          onProgress={handleProgress}
          config={{
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              playsinline: 1,
            },
          }}
        />

        <div
          className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
          style={{ userSelect: 'none', transition: 'opacity 2s ease' }}
          aria-hidden="true"
        >
          {watermarkPositions.map((pos, index) => (
            <div
              key={index}
              className="absolute text-white text-xs font-medium whitespace-nowrap transform -rotate-12 select-none"
              style={{
                top: pos.top,
                left: pos.left,
                opacity: watermarkOpacity,
                fontFamily: 'monospace',
                mixBlendMode: 'overlay',
                transition: 'opacity 2s ease',
              }}
            >
              {maskedEmail} | ID:{shortId}
            </div>
          ))}

          <div
            className="absolute top-3 right-3 text-white text-sm font-semibold select-none"
            style={{ opacity: watermarkOpacity, mixBlendMode: 'overlay' as const, transition: 'opacity 2s ease' }}
          >
            Sadguru Coaching Classes
          </div>

          <div
            className="absolute bottom-14 left-3 text-white text-xs font-medium select-none"
            style={{ fontFamily: 'monospace', opacity: watermarkOpacity, mixBlendMode: 'overlay' as const, transition: 'opacity 2s ease' }}
          >
            Licensed to: {maskedEmail}
          </div>

          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-8">
            {[...Array(9)].map((_, i) => (
              <div
                key={`tile-${i}`}
                className="flex items-center justify-center text-white text-xs font-medium whitespace-nowrap transform -rotate-45 select-none"
                style={{ fontFamily: 'monospace', opacity: watermarkFaded ? 0.01 : 0.05, transition: 'opacity 2s ease' }}
              >
                {shortId}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 z-10"
        style={{ background: 'linear-gradient(to right, hsl(var(--primary)), #ff6b00)' }}
      />
    </div>
  );
};

export default GhostWatermarkPlayer;
