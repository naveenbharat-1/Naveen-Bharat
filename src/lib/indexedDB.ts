/**
 * IndexedDB wrapper for in-app Downloads section.
 * DB: sadguru_app  |  Store: downloads
 */

const DB_NAME = "sadguru_app";
const DB_VERSION = 1;
const STORE = "downloads";

export interface DownloadRecord {
  id?: number;
  title: string;
  filename: string;
  url: string;
  downloadedAt: string; // ISO 8601
  fileType: "PDF" | "NOTES" | "DPP" | string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("downloadedAt", "downloadedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addDownload(
  item: Omit<DownloadRecord, "id">
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getDownloads(): Promise<DownloadRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(
        ((req.result as DownloadRecord[]) || []).sort(
          (a, b) =>
            new Date(b.downloadedAt).getTime() -
            new Date(a.downloadedAt).getTime()
        )
      );
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDownload(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
