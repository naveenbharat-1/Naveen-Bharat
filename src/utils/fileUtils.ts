/**
 * File download utilities — handles Drive, Docs, Archive.org & direct PDF URLs
 */

/** Extract Google Drive file ID from various URL formats */
export const extractDriveFileId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
};

/** Extract Google Docs document ID */
export const extractDocsId = (url: string): string | null => {
  const match = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
};

/** Extract Archive.org item identifier */
export const extractArchiveId = (url: string): string | null => {
  const match = url.match(/archive\.org\/(?:details|embed|download)\/([^/?#]+)/);
  return match?.[1] || null;
};

/**
 * Async: fetch Archive.org metadata API to find the best direct PDF download URL.
 * Falls back to the {id}.pdf pattern, then the download listing page.
 */
export const getArchiveDownloadUrl = async (identifier: string): Promise<string> => {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`, { mode: "cors" });
    if (res.ok) {
      const meta = await res.json();
      const files: Array<{ name: string; format: string }> = meta?.files ?? [];
      // Prefer a file whose format is "Text PDF" or contains "pdf"
      const pdf = files.find(
        (f) =>
          /text pdf/i.test(f.format) ||
          (/pdf/i.test(f.format) && f.name.toLowerCase().endsWith(".pdf"))
      ) || files.find((f) => f.name.toLowerCase().endsWith(".pdf"));
      if (pdf) {
        return `https://archive.org/download/${identifier}/${encodeURIComponent(pdf.name)}`;
      }
    }
  } catch {
    // metadata fetch failed — fall through
  }
  // Fallback: common {id}.pdf pattern
  return `https://archive.org/download/${identifier}/${identifier}.pdf`;
};

/** Get a direct download URL for various sources (synchronous fallback) */
export const getDownloadUrl = (url: string): string => {
  // Google Drive
  const driveId = extractDriveFileId(url);
  if (driveId && /drive\.google\.com/.test(url)) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  }

  // Google Docs
  const docsId = extractDocsId(url);
  if (docsId) {
    return `https://docs.google.com/document/d/${docsId}/export?format=pdf`;
  }

  // Archive.org — sync fallback uses {id}.pdf pattern (async version preferred in components)
  const archiveId = extractArchiveId(url);
  if (archiveId) {
    return `https://archive.org/download/${archiveId}/${archiveId}.pdf`;
  }

  // Direct URL — return as-is
  return url;
};

/** Extract a reasonable filename from a URL */
const extractFilename = (url: string, fallback = "document.pdf"): string => {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /\.\w+$/.test(last)) return decodeURIComponent(last);
  } catch {
    // ignore
  }
  return fallback;
};

/**
 * Download a file directly without leaving the app.
 * Tries blob fetch first; falls back to opening the download URL in a new tab.
 */
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  const downloadUrl = getDownloadUrl(url);
  const name = filename || extractFilename(downloadUrl);

  try {
    const res = await fetch(downloadUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 200);
      return;
    }
  } catch {
    // CORS blocked — fall through
  }

  // Fallback: open the download URL directly
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = name;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 200);
};
