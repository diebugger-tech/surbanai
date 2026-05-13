import { useState, useEffect, useRef } from 'react';
import db from '../lib/db';

const STORAGE_KEY = 'surreal_kanban_cache';

/**
 * useSurrealDB Hook
 * Handles real-time project synchronization with SurrealDB.
 * Implements a localStorage fallback for offline support.
 */
export function useSurrealDB() {
  const [projects, setProjects] = useState([]);
  const [dbStatus, setDbStatus] = useState('CONNECTING...');
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);
  const liveQueryId = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function initDB() {
      try {
        setLoading(true);
        setDbError(null);
        
        // Close any stale connection first
        try { await db.close(); } catch (_) { /* ignore */ }

        if (!isMounted) return;

        // Attempt connection
        await db.connect(import.meta.env.VITE_SURREAL_URL, {
          namespace: import.meta.env.VITE_SURREAL_NS,
          database: import.meta.env.VITE_SURREAL_DB,
          authentication: { 
            username: import.meta.env.VITE_SURREAL_USER, 
            password: import.meta.env.VITE_SURREAL_PASS 
          }
        });
        
        if (!isMounted) {
          db.close();
          return;
        }

        setDbStatus('ONLINE');

        // Initial fetch (exclude archived projects)
        const initialProjects = await db.query('SELECT * FROM projekt WHERE status != "archived" ORDER BY erstellt DESC').then(r => r[0]);
        if (initialProjects && isMounted) {
          const data = initialProjects.result || initialProjects;
          setProjects(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        // Live Subscription
        const liveQuery = await db.live('projekt', ({ action, result }) => {
          if (!isMounted) return;
          setProjects(prev => {
            let next;
            if (action === 'CREATE') {
              if (result.status !== 'archived') next = [...prev, result];
            } else if (action === 'UPDATE' || action === 'CHANGE') {
              if (result.status === 'archived') {
                next = prev.filter(p => p.id !== result.id);
              } else {
                const exists = prev.find(p => p.id === result.id);
                next = exists ? prev.map(p => p.id === result.id ? result : p) : [...prev, result];
              }
            } else if (action === 'DELETE') {
              next = prev.filter(p => p.id !== result.id);
            } else {
              next = prev;
            }
            if (next) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            }
            return prev;
          });
        });

        if (isMounted) {
          liveQueryId.current = liveQuery;
        } else {
          liveQuery.kill().catch(() => {});
        }

      } catch (err) {
        if (!isMounted) return;
        console.error('SurrealDB Connection Error:', err);
        setDbError(err.message || String(err));
        
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setProjects(JSON.parse(cached));
            setDbStatus('OFFLINE (cached)');
          } catch (parseErr) {
            setDbStatus('OFFLINE (error)');
          }
        } else {
          setDbStatus('OFFLINE');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initDB();

    return () => {
      isMounted = false;
      if (liveQueryId.current) {
        liveQueryId.current.kill().catch(() => {});
      }
    };
  }, []);

  return { projects, dbStatus, dbError, loading };
}
