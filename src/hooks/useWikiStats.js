import { useState, useEffect } from 'react';
import db from '../lib/db';

/**
 * useWikiStats Hook
 * Fetches and live-syncs wiki entry counts per project.
 * Accepts an optional callback for live events (used for logging).
 * This ensures only ONE db.live('wiki') subscription exists in the entire app.
 */
export function useWikiStats(onLiveEvent) {
  const [wikiStats, setWikiStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await db.query(
          'SELECT count(typ = "todo" AND status = "done") as done, count(typ = "todo") as total, projekt FROM wiki GROUP BY projekt'
        );
        // Normalize SDK response regardless of version quirks
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

    fetchStats();

    // Single LIVE subscription — handles both stats refresh AND optional external logging
    const unsubPromise = db.live('wiki', (res) => {
      fetchStats();
      onLiveEvent?.(res);
    });

    return () => {
      unsubPromise.then(uuid => db.kill(uuid)).catch(() => {});
    };
  // onLiveEvent intentionally excluded from deps to avoid re-subscribing on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return wikiStats;
}
