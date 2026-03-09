import { memo, useMemo } from "react";

interface SheetViewerProps {
  url: string;
  title?: string;
}

/**
 * Sheet/Document viewer using Google Docs Viewer for xlsx/xls/csv files
 */
const SheetViewer = memo(({ url, title }: SheetViewerProps) => {
  const embedUrl = useMemo(() => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }, [url]);

  return (
    <div className="flex flex-col w-full h-full">
      <iframe
        src={embedUrl}
        className="w-full border-0 flex-1"
        title={title || "Spreadsheet Preview"}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="eager"
        style={{ height: '100dvh', minHeight: '70vh' }}
      />
    </div>
  );
});

SheetViewer.displayName = "SheetViewer";

export default SheetViewer;
