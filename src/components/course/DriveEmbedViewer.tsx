import { memo, useMemo, useState, useEffect } from "react";
import { Download, Maximize, Minimize, FileText, Loader2 } from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
import { Button } from "@/components/ui/button";
import { downloadFile, extractArchiveId, extractDocsId, getArchiveDownloadUrl } from "@/utils/fileUtils";
import { toast } from "sonner";
import sadguruLogo from "@/assets/branding/logo_primary_web.png";

interface DriveEmbedViewerProps {
  url: string;
  title?: string;
  onDownloaded?: (info: { title: string; url: string; filename: string }) => void;
}

const DriveEmbedViewer = memo(({ url, title, onDownloaded }: DriveEmbedViewerProps) => {
  const [downloading, setDownloading] = useState(false);
  const { addDownload } = useDownloads();
  const [isFullscreen, setIsFullscreen] = useState(false);
  // For Archive.org: resolved direct PDF URL (async via metadata API)
  const [archiveDirectUrl, setArchiveDirectUrl] = useState<string | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const { embedUrl, openUrl, canRender, isArchive, archiveId } = useMemo(() => {
    // Google Drive
    if (/drive\.google\.com/.test(url)) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch?.[1] || idParamMatch?.[1];
      if (fileId) {
        return {
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          openUrl: `https://drive.google.com/file/d/${fileId}/view`,
          canRender: true,
          isArchive: false,
          archiveId: null,
        };
      }
    }

    // Google Docs
    const docsId = extractDocsId(url);
    if (docsId) {
      return {
        embedUrl: `https://docs.google.com/document/d/${docsId}/preview`,
        openUrl: `https://docs.google.com/document/d/${docsId}/edit`,
        canRender: true,
        isArchive: false,
        archiveId: null,
      };
    }

    // Archive.org — detect & flag; direct PDF resolved asynchronously
    const aid = extractArchiveId(url);
    if (aid) {
      return {
        embedUrl: "",
        openUrl: `https://archive.org/details/${aid}`,
        canRender: true,
        isArchive: true,
        archiveId: aid,
      };
    }

    // Direct PDF
    if (/\.pdf($|\?)/i.test(url)) {
      return { embedUrl: url, openUrl: url, canRender: true, isArchive: false, archiveId: null };
    }

    return { embedUrl: url, openUrl: url, canRender: false, isArchive: false, archiveId: null };
  }, [url]);

  // Resolve Archive.org direct PDF URL on mount / when archiveId changes
  useEffect(() => {
    if (!isArchive || !archiveId) return;
    setArchiveLoading(true);
    getArchiveDownloadUrl(archiveId)
      .then((directUrl) => setArchiveDirectUrl(directUrl))
      .catch(() => setArchiveDirectUrl(`https://archive.org/download/${archiveId}/${archiveId}.pdf`))
      .finally(() => setArchiveLoading(false));
  }, [isArchive, archiveId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (isArchive && archiveId) {
        toast.info("Finding PDF file…");
        const directUrl = archiveDirectUrl || await getArchiveDownloadUrl(archiveId);
        const filename = title ? `${title}.pdf` : `${archiveId}.pdf`;
        await downloadFile(directUrl, filename);
        await addDownload(title || archiveId, directUrl, filename, "PDF");
        onDownloaded?.({ title: title || archiveId, url: directUrl, filename });
      } else {
        const filename = title ? `${title}.pdf` : "document.pdf";
        await downloadFile(url, filename);
        await addDownload(title || "Document", url, filename, "PDF");
        onDownloaded?.({ title: title || "Document", url, filename });
      }
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (!canRender) return null;

  // The PDF src to embed (for Archive: direct URL; for others: embedUrl)
  const iframeSrc = isArchive ? (archiveDirectUrl || "") : embedUrl;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] bg-background flex flex-col"
          : "relative w-full h-full min-h-[70vh] rounded-xl overflow-hidden border border-border bg-card flex flex-col"
      }
    >
      {/* Header bar */}
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
            disabled={downloading || (isArchive && archiveLoading)}
            title="Download PDF"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline text-xs">
              {downloading ? "Downloading…" : "Download"}
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

      {/* PDF / iframe area */}
      <div className="relative flex-1 min-h-0">
        {/* Archive.org: loading state while resolving direct PDF URL */}
        {isArchive && archiveLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading PDF…</p>
          </div>
        )}

        {/* Render PDF iframe once URL is known */}
        {iframeSrc && (
          <iframe
            key={iframeSrc}
            src={isArchive ? `${iframeSrc}#toolbar=0&navpanes=0` : iframeSrc}
            className="absolute inset-0 w-full h-full border-0"
            title={title || "Document Preview"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="eager"
            allowFullScreen
          />
        )}

        {/* Archive.org top-bar mask — replaces IA logo/nav with Sadguru branding */}
        {isArchive && iframeSrc && (
          <div
            className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 pointer-events-none select-none"
            style={{ height: "52px", background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border))" }}
            aria-hidden="true"
          >
            <img
              src={sadguruLogo}
              alt="Sadguru Coaching Classes"
              className="h-7 w-auto opacity-90"
              draggable={false}
            />
            <span className="text-sm font-semibold text-foreground truncate">
              Sadguru Coaching Classes
            </span>
          </div>
        )}

        {/* Sadguru Coaching Classes watermark — bottom-right, always visible */}
        <div
          className="absolute bottom-3 right-3 z-20 flex items-center gap-2 select-none pointer-events-none"
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

DriveEmbedViewer.displayName = "DriveEmbedViewer";

export default DriveEmbedViewer;
