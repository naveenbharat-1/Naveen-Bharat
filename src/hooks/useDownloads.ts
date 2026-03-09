import { useState, useEffect, useCallback } from "react";
import {
  addDownload as dbAdd,
  getDownloads as dbGet,
  deleteDownload as dbDelete,
  type DownloadRecord,
} from "@/lib/indexedDB";

export type { DownloadRecord };

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const records = await dbGet();
      setDownloads(records);
    } catch (err) {
      console.error("useDownloads: failed to read IndexedDB", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addDownload = useCallback(
    async (
      title: string,
      url: string,
      filename: string,
      fileType: DownloadRecord["fileType"] = "PDF"
    ) => {
      try {
        await dbAdd({
          title,
          filename,
          url,
          downloadedAt: new Date().toISOString(),
          fileType,
        });
        await refresh();
      } catch (err) {
        console.error("useDownloads: failed to add download", err);
      }
    },
    [refresh]
  );

  const deleteDownloadById = useCallback(
    async (id: number) => {
      try {
        await dbDelete(id);
        setDownloads((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        console.error("useDownloads: failed to delete download", err);
      }
    },
    []
  );

  return { downloads, loading, addDownload, deleteDownload: deleteDownloadById, refresh };
}
