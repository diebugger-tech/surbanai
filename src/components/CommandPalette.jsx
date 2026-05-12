import React, { useState, useEffect, useRef } from 'react';
import db from '../lib/db';

// ─── TypeBadge ─────────────────────────────────────────────────────────────
// Monospace terminal-style badge — DOC/BUG/TODO instead of emoji
const TYPE_MAP = {
  doc:    { label: 'DOC',  color: 'var(--accent-blue,  #378ADD)' },
  bug:    { label: 'BUG',  color: 'var(--accent-red,   #E24B4A)' },
  todo:   { label: 'TODO', color: 'var(--accent-green, #1D9E75)' },
  system: { label: 'SYS',  color: 'var(--text-muted,  #888)' },
};

function TypeBadge({ typ }) {
  const { label, color } = TYPE_MAP[typ] || { label: (typ || '?').toUpperCase(), color: 'gray' };
  return (
    <span style={{
      fontFamily: 'monospace',
      fontSize: '10px',
      padding: '1px 5px',
      border: `1px solid ${color}`,
      borderRadius: '3px',
      color,
      marginRight: '6px',
      letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── KAi Ollama helper ─────────────────────────────────────────────────────
// Calls local Ollama — same pattern as KAiPanel.jsx but returns a string
async function askKAi(prompt) {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'qwen2.5:3b',
      prompt,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const json = await res.json();
  return json.response?.trim() || '(no response)';
}

const CONTEXT_CHAR_LIMIT = 2000;

// ─── CommandPalette ─────────────────────────────────────────────────────────
export default function CommandPalette({ projects, onSelectProject, onClose, onOpenWikiEntry }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wikiResults, setWikiResults] = useState([]);
  const [kaiAnswer, setKaiAnswer] = useState(null);
  const [kaiLoading, setKaiLoading] = useState(false);
  const inputRef = useRef(null);

  // ── Project filter (client-side, instant) ──────────────────────────────
  const q = query.toLowerCase();
  const filteredProjects = projects.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.desc?.toLowerCase().includes(q) ||
    p.stack?.toLowerCase().includes(q) ||
    (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
  );

  // ── Wiki search + KAi fallback (debounced 200ms) ──────────────────────
  useEffect(() => {
    if (!query || query.length < 2) {
      setWikiResults([]);
      setKaiAnswer(null);
      setKaiLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await db.query(
          `SELECT id, titel, typ, projekt, inhalt FROM wiki
           WHERE string::lowercase(titel) CONTAINS string::lowercase($q)
              OR string::lowercase(inhalt) CONTAINS string::lowercase($q)
           LIMIT 5`,
          { q: query }
        );
        const hits = results[0] || [];
        setWikiResults(Array.isArray(hits) ? hits : []);

        // No wiki hits → ask KAi with wiki context as grounding
        if (!hits || hits.length === 0) {
          setKaiLoading(true);
          setKaiAnswer(null);

          const ctxRes = await db.query(
            'SELECT titel, inhalt, projekt FROM wiki LIMIT 30'
          );
          const ctxEntries = ctxRes[0] || [];
          const fullCtx = Array.isArray(ctxEntries)
            ? ctxEntries.map(e => `${e.titel}: ${e.inhalt}`).join('\n')
            : '';
          const context = fullCtx.slice(0, CONTEXT_CHAR_LIMIT);

          const answer = await askKAi(
            `You are KAi, a terminal-based project assistant.\n` +
            `Wiki context:\n${context}\n\nQuestion: ${query}\n` +
            `Answer briefly in 1–2 sentences.`
          );
          setKaiAnswer(answer);
        } else {
          setKaiAnswer(null);
        }
      } catch (err) {
        console.warn('Wiki search / KAi error:', err);
        setKaiAnswer(`ERROR: ${err.message}`);
      } finally {
        setKaiLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // ── Focus input on mount ───────────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(filteredProjects.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(filteredProjects.length, 1)) % Math.max(filteredProjects.length, 1));
    } else if (e.key === 'Enter') {
      if (filteredProjects[selectedIndex]) {
        onSelectProject(filteredProjects[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 2000,
    },
    container: {
      width: '100%',
      maxWidth: '640px',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--accent-green)',
      boxShadow: '0 0 30px rgba(0, 255, 170, 0.2)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '70vh',
    },
    input: {
      width: '100%',
      padding: '1.2rem',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--border)',
      color: 'var(--accent-green)',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '1.2rem',
      outline: 'none',
      boxSizing: 'border-box',
    },
    list: {
      overflowY: 'auto',
      padding: '0.5rem',
      flex: 1,
    },
    groupLabel: {
      fontSize: '0.65rem',
      color: 'var(--text-muted)',
      letterSpacing: '1px',
      padding: '0.5rem 1rem 0.25rem',
      textTransform: 'uppercase',
    },
    item: (active) => ({
      padding: '0.75rem 1rem',
      backgroundColor: active ? 'rgba(0, 255, 170, 0.1)' : 'transparent',
      color: active ? 'var(--accent-green)' : 'var(--text-primary)',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '4px',
      gap: '0.5rem',
    }),
    wikiItem: {
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      borderRadius: '4px',
      transition: 'background 0.1s',
    },
    badge: {
      fontSize: '0.7rem',
      padding: '0.2rem 0.5rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      color: 'var(--text-muted)',
      flexShrink: 0,
    },
    resultSub: {
      marginLeft: 'auto',
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      flexShrink: 0,
    },
    kaiRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.8rem',
      padding: '0.75rem 1rem',
      borderTop: '1px solid var(--border)',
      marginTop: '0.25rem',
    },
    kaiLabel: {
      fontFamily: 'monospace',
      fontSize: '0.75rem',
      color: 'var(--accent-green)',
      fontWeight: 'bold',
      flexShrink: 0,
      paddingTop: '1px',
    },
    footer: {
      padding: '0.8rem',
      backgroundColor: 'rgba(0,0,0,0.2)',
      fontSize: '0.65rem',
      color: 'var(--text-muted)',
      display: 'flex',
      justifyContent: 'space-between',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="SEARCH_PROJECTS_OR_WIKI..."
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
        />

        <div style={styles.list}>
          {/* ── Projects ───────────────────────────────────────────── */}
          {filteredProjects.length > 0 && (
            <>
              <div style={styles.groupLabel}>Projekte</div>
              {filteredProjects.map((p, idx) => (
                <div
                  key={p.id}
                  style={styles.item(idx === selectedIndex)}
                  onClick={() => { onSelectProject(p.id); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{p.stack}</div>
                  </div>
                  <div style={styles.badge}>{(p.status || '').toUpperCase()}</div>
                </div>
              ))}
            </>
          )}

          {/* ── Wiki Results ────────────────────────────────────────── */}
          {wikiResults.length > 0 && (
            <>
              <div style={styles.groupLabel}>Wiki</div>
              {wikiResults.map(entry => (
                <div
                  key={entry.id}
                  style={styles.wikiItem}
                  onClick={() => onOpenWikiEntry && onOpenWikiEntry(entry)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,255,170,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <TypeBadge typ={entry.typ} />
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}>
                    {entry.titel}
                  </span>
                  <span style={styles.resultSub}>{entry.projekt}</span>
                </div>
              ))}
            </>
          )}

          {/* ── No results at all ──────────────────────────────────── */}
          {!kaiLoading && !kaiAnswer && filteredProjects.length === 0 && wikiResults.length === 0 && query.length > 0 && (
            <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>&gt; NO_RESULTS_FOUND</div>
          )}
        </div>

        {/* ── KAi Loader ─────────────────────────────────────────── */}
        {kaiLoading && (
          <div style={styles.kaiRow}>
            <span style={styles.kaiLabel}>KAi</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
              denkt nach... █▒▒
            </span>
          </div>
        )}

        {/* ── KAi Answer ─────────────────────────────────────────── */}
        {kaiAnswer && !kaiLoading && (
          <div style={styles.kaiRow}>
            <span style={styles.kaiLabel}>KAi</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {kaiAnswer}
            </span>
          </div>
        )}

        <div style={styles.footer}>
          <span>↑↓ NAVIGATE // ENTER SELECT // ESC CLOSE</span>
          <span>KAiOSS v1.4</span>
        </div>
      </div>
    </div>
  );
}
