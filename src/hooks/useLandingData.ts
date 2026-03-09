import { useState, useEffect, useCallback } from "react";

export interface SiteStat {
  id: number;
  statKey: string;
  statValue: string;
}

export interface LandingContent {
  sectionKey: string;
  content: any;
}

export const useLandingData = () => {
  const [stats, setStats] = useState<SiteStat[]>([]);
  const [content, setContent] = useState<LandingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStats([
      { id: 1, statKey: 'students', statValue: '500+' },
      { id: 2, statKey: 'courses', statValue: '20+' },
      { id: 3, statKey: 'teachers', statValue: '10+' },
    ]);
  }, []);

  const fetchContent = useCallback(async () => {
    setContent([]);
  }, []);

  const getStatValue = useCallback((key: string): string => {
    const stat = stats.find((s) => s.statKey === key);
    return stat?.statValue || '0';
  }, [stats]);

  const getContentByKey = useCallback((key: string): any => {
    const item = content.find((c) => c.sectionKey === key);
    return item?.content || null;
  }, [content]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStats(), fetchContent()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchContent]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    stats,
    content,
    loading,
    error,
    fetchAll,
    getStatValue,
    getContentByKey,
  };
};
