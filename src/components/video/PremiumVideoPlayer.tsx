import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Play, Pause, Settings, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import EndScreenOverlay from './EndScreenOverlay';
import skipBack10Icon from '@/assets/icons/skip-back-10.png';
import skipForward10Icon from '@/assets/icons/skip-forward-10.png';

interface PremiumVideoPlayerProps {
  videoUrl: string;
  title?: string;
  lessonId?: string;
  onEnded?: () => void;
  onReady?: () => void;
}

const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({ videoUrl, title, lessonId, onEnded, onReady }) => {
  const playerRef = useRef<ReactPlayer>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Player state
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  // UI state
  const [controlsVisible, setControlsVisible] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [watermarkVisible, setWatermarkVisible] = useState(true);
  const playTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Extract YouTube ID from various URL formats
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return url;
  };

  const videoId = extractYouTubeId(videoUrl);
  const fullVideoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl;

  // Smart hide controls after inactivity (5 seconds per spec)
  const kickTimer = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    setCursorHidden(false);
    hideTimerRef.current = setTimeout(() => {
      if (playing && !showSettings && !showVolumeSlider) {
        setControlsVisible(false);
        setCursorHidden(true);
      }
    }, 5000);
  }, [playing, showSettings, showVolumeSlider]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    
    const handleActivity = () => kickTimer();
    node.addEventListener('mousemove', handleActivity);
    node.addEventListener('touchstart', handleActivity);
    kickTimer();

    return () => {
      node.removeEventListener('mousemove', handleActivity);
      node.removeEventListener('touchstart', handleActivity);
      clearTimeout(hideTimerRef.current);
    };
  }, [kickTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setPlaying(p => !p);
          kickTimer();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'KeyM':
          setMuted(m => !m);
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kickTimer]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Intelligent watermark: fade after 10s of continuous playback
  useEffect(() => {
    if (playing) {
      playTimerRef.current = setTimeout(() => setWatermarkVisible(false), 10000);
    } else {
      setWatermarkVisible(true);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }
    return () => { if (playTimerRef.current) clearTimeout(playTimerRef.current); };
  }, [playing]);

  const seekBy = (seconds: number) => {
    if (playerRef.current && duration > 0) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, Math.min(duration, currentTime + seconds)));
      kickTimer();
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  };

  const handleProgress = (state: { played: number; loaded: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  const handleSeekMouseDown = () => setSeeking(true);
  
  const handleSeekChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setPlayed(fraction);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setSeeking(false);
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerRef.current?.seekTo(fraction);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const handlePlayerReady = () => {
    setIsReady(true);
    setHasError(false);
    onReady?.();
  };

  const handlePlayerError = () => {
    setHasError(true);
    setIsReady(false);
  };

  const handleBuffer = () => {
    setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Don't render if no valid URL
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <p className="text-white/50">No video URL provided</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full bg-black rounded-xl overflow-hidden select-none group",
        cursorHidden && "cursor-none"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Video Player */}
      <div className="aspect-video relative" onClick={(e) => e.stopPropagation()}>
        <ReactPlayer
          ref={playerRef}
          url={fullVideoUrl}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onDuration={setDuration}
          onEnded={() => { setShowEndScreen(true); setPlaying(false); onEnded?.(); }}
          onPlay={() => { setPlaying(true); setShowEndScreen(false); }}
          onPause={() => setPlaying(false)}
          onReady={handlePlayerReady}
          onError={handlePlayerError}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          controls={false}
          playsinline
          config={{
            playerVars: {
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              showinfo: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              origin: window.location.origin,
            },
            embedOptions: {
              host: 'https://www.youtube-nocookie.com',
            },
          }}
        />

        {/* Loading Overlay */}
        {(!isReady || isBuffering) && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
              <p className="text-white/70 text-sm">{isBuffering ? 'Buffering...' : 'Loading video...'}</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-white font-medium mb-2">Video unavailable</p>
              <p className="text-white/50 text-sm">Unable to load this video. Please try again later.</p>
            </div>
          </div>
        )}

        <div 
          className="absolute inset-0 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setControlsVisible(v => !v);
            kickTimer();
          }}
        />


        {/* Big play button when paused - clickable */}
        {!playing && isReady && !hasError && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
            onClick={() => { setPlaying(true); kickTimer(); }}
          >
            <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center border-2 border-white/30 transition-transform hover:scale-110">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Ghost mask overlay removed — clean video */}

        {/* End Screen Overlay */}
        {showEndScreen && (
          <EndScreenOverlay
            onReplay={() => {
              setShowEndScreen(false);
              playerRef.current?.seekTo(0);
              setTimeout(() => setPlaying(true), 100);
            }}
          />
        )}
      </div>

      {/* Custom Control Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 transition-all duration-300",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

        {/* Progress bar */}
        <div 
          ref={progressRef}
          className="relative h-1 mx-4 mt-2 cursor-pointer group/progress"
          onMouseDown={handleSeekMouseDown}
          onClick={handleSeekChange}
          onMouseUp={handleSeekMouseUp}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div 
            className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
            style={{ width: `${loaded * 100}%` }}
          />
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${played * 100}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
            style={{ left: `calc(${played * 100}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="relative flex items-center gap-2 px-4 py-3">
          {/* Play/Pause */}
          <button
            onClick={() => setPlaying(p => !p)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            disabled={!isReady || hasError}
          >
            {playing ? (
              <Pause className="w-5 h-5 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            )}
          </button>

          {/* Skip backward */}
          <button
            onClick={() => seekBy(-10)}
            className="p-2 bg-transparent border-none transition-transform duration-200 active:scale-90"
            disabled={!isReady || hasError}
            title="Backward 10s"
            aria-label="Backward 10s"
          >
            <img src={skipBack10Icon} alt="Backward 10s" className="w-5 h-5" style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.9))' }} />
          </button>

          {/* Skip forward */}
          <button
            onClick={() => seekBy(10)}
            className="p-2 bg-transparent border-none transition-transform duration-200 active:scale-90"
            disabled={!isReady || hasError}
            title="Forward 10s"
            aria-label="Forward 10s"
          >
            <img src={skipForward10Icon} alt="Forward 10s" className="w-5 h-5" style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.9))' }} />
          </button>

          {/* Volume */}
          <div className="relative flex items-center">
            <button
              onClick={() => setMuted(m => !m)}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            
            {showVolumeSlider && (
              <div 
                className="flex items-center ml-1"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setMuted(false);
                  }}
                  className="w-20 h-1 accent-primary cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Time display */}
          <div className="text-white text-sm font-medium ml-2">
            {formatTime(played * duration)} / {formatTime(duration)}
          </div>

          {/* Quality badge */}
          <div className="px-2 py-1 bg-white/10 rounded text-xs text-white font-medium">
            Auto / HD
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Settings className="w-5 h-5 text-white" />
              {playbackRate !== 1 && (
                <span className="text-xs text-primary font-semibold">{playbackRate}x</span>
              )}
            </button>

            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg py-2 min-w-[140px] shadow-xl">
                <div className="px-3 py-1.5 text-xs text-gray-400 font-medium border-b border-white/10">
                  Playback Speed
                </div>
                {playbackRates.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors",
                      rate === playbackRate ? "text-primary font-semibold" : "text-white"
                    )}
                  >
                    {rate}x {rate === 1 && "(Normal)"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Watermark - bottom-right to cover YouTube branding */}
      <div 
        className="absolute bottom-16 right-4 z-50 select-none pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded"
        style={{
          background: 'rgba(0,0,0,0.3)',
          opacity: watermarkVisible ? 0.7 : 0.05,
          transition: 'opacity 1.5s ease',
        }}
      >
        <span className="text-white text-xs font-semibold">Sadguru Coaching Classes</span>
      </div>
    </div>
  );
};

export default PremiumVideoPlayer;
