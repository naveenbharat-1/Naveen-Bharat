import appLogo from "@/assets/branding/logo_icon_web.png";

interface LivePlayerProps {
  youtubeId: string;
  title: string;
}

const LivePlayer = ({ youtubeId, title }: LivePlayerProps) => {
  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: "none" }}
      />
      {/* Sadguru watermark */}
      <div className="absolute bottom-2 right-2 pointer-events-none z-10 opacity-70">
        <div className="flex items-center gap-1 bg-black/60 rounded-md px-2 py-1">
          <img src={appLogo} alt="Sadguru" className="h-4 w-4 rounded-sm" />
          <span className="text-white text-[9px] font-semibold tracking-wide">Sadguru</span>
        </div>
      </div>
    </div>
  );
};

export default LivePlayer;
