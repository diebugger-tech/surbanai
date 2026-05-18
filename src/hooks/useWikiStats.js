import { useState, useEffect } from 'react';
import db from '../lib/db';

/**
 * useWikiStats Hook
 * Fetches and live-syncs wiki entry counts per project.
 * Accepts an optional callback for live events (used for logging).
 * This ensures only ONE db.live('wiki') subscription exists in the entire app.
 */
export function useWikiStats(ready, onLiveEvent) {
  const [wikiStats, setWikiStats] = useState({});

  useEffect(() => {
    if (!ready) return;

    const fetchStats = async () => {
      try {
        const res = await db.query(
          'SELECT count(typ = "todo" AND status = "done") as done, count(typ = "todo") as total, projekt FROM wiki GROUP BY projekt'
        );
        const data = Array.isArray(res[0]) ? res[0] : (res[0]?.result ?? []);
        const stats = {};
        data.forEach(r => {
          stats[r.projekt] = { done: r.done, total: r.total };
        });
        setWikiStats(stats);
      } catch (err) {
        console.error('[useWikiStats] Stats fetch failed:', err);
      }
    };

    let liveId = null;
    let isMounted = true;

    const startLive = async () => {
      try {
        const id = await db.live('wiki', (res) => {
          if (isMounted) {
            fetchStats();
            onLiveEvent?.(res);
          }
        });
        if (isMounted) liveId = id;
        else if (id && db.kill) db.kill(id).catch(() => {});
      } catch (err) {
        console.warn('[WikiStats] Live sync failed:', err);
      }
    };

    fetchStats();
    startLive();

    return () => {
      isMounted = false;
      if (liveId && db.kill) db.kill(liveId).catch(() => {});
    };
  }, [ready, onLiveEvent]);

  return wikiStats;
}

export function getPhaseProgress(todos, phase) {
  const phaseTodos = (todos || []).filter(t => {
    const match = t.tag?.match(/Phase\s+(\d+)/i);
    const pNum = match ? parseInt(match[1]) : 0;
    return pNum === phase;
  });
  if (phaseTodos.length === 0) return { done: 0, total: 0, percent: 0 };
  const done = phaseTodos.filter(t => {
    const status = t.status?.toLowerCase();
    const title = t.titel?.trim() || '';
    return status === 'done' || status === 'erledigt' || title.startsWith('✔') || title.startsWith('[x]') || title.startsWith('[X]');
  }).length;
  const total = phaseTodos.length;
  const percent = Math.round((done / total) * 100) || 0;
  return { done, total, percent };
}

export function getTotalProgress(todos) {
  if (!todos || todos.length === 0) return { done: 0, total: 0, percent: 0 };
  const done = todos.filter(t => {
    const status = t.status?.toLowerCase();
    const title = t.titel?.trim() || '';
    return status === 'done' || status === 'erledigt' || title.startsWith('✔') || title.startsWith('[x]') || title.startsWith('[X]');
  }).length;
  const total = todos.length;
  const percent = Math.round((done / total) * 100) || 0;
  return { done, total, percent };
}

