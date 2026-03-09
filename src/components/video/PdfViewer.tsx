import { memo, useMemo, useState } from "react";
import { FileText, Maximize, Minimize, Download } from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/utils/fileUtils";
import { toast } from "sonner";
import sadguruLogo from "@/assets/branding/logo_primary_web.png";

interface PdfViewerProps {
  url: string;
  title?: string;
  onDownloaded?: (info: { title: string; url: string; filename: string }) => void;
}

const PdfViewer = memo(({ url, title, onDownloaded }: PdfViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { addDownload } = useDownloads();

  const { embedUrl, openUrl } = useMemo(() => {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const driveIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = driveMatch?.[1] || driveIdParam?.[1];

    if (fileId || /drive\.google\.com/.test(url)) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        openUrl: `https://drive.google.com/file/d/${fileId}/view`,
      };
    }

    if (/\.pdf($|\?)/i.test(url)) {
      return {
        embedUrl: url.includes("#") ? url : `${url}#toolbar=0&navpanes=0`,
        openUrl: url,
      };
    }

    return { embedUrl: url, openUrl: url };
  }, [url]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = title ? `${title}.pdf` : "document.pdf";
      await downloadFile(url, filename);
      await addDownload(title || "Document", url, filename, "PDF");
      toast.success("Download started");
      onDownloaded?.({ title: title || "Document", url, filename });
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] bg-background flex flex-col"
          : "relative w-full rounded-xl overflow-hidden border border-border bg-card flex flex-col"
      }
      style={isFullscreen ? undefined : { height: "calc(100dvh - 44px)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border shrink-0">
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {title || "Document"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            disabled={downloading}
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline text-xs">
              {downloading ? "…" : "Download"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* PDF iframe — fills remaining space */}
      <div className="relative flex-1 min-h-0">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title={title || "PDF Document"}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          loading="lazy"
        />

        {/* Sadguru Coaching Classes watermark — bottom-right, semi-transparent */}
        <div
          className="absolute bottom-3 right-3 z-20 select-none pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={sadguruLogo}
            alt=""
            className="h-7 sm:h-9 w-auto opacity-40 drop-shadow-md"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
});

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
