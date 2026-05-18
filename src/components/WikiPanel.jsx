import React, { useState, useEffect, useCallback } from 'react';
import db from '../lib/db';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';
import { getPhaseProgress, getTotalProgress } from '../hooks/useWikiStats';
import './WikiPanel.css';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'var(--bg-overlay)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
  },
  container: {
    width: '100%', maxWidth: '1000px', height: '85vh',
    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
    boxShadow: '0 0 50px rgba(0,0,0,0.5)', display: 'flex', position: 'relative',
    overflow: 'hidden'
  },
  sidebar: {
    width: '260px', borderRight: '1px solid var(--border)', padding: '1.5rem',
    backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    overflowY: 'auto'
  },
  main: {
    flex: 1, padding: '3rem', overflowY: 'auto', color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)'
  },
  manifestSidebar: {
    marginTop: '2rem',
    padding: '0.5rem',
    backgroundColor: 'rgba(0, 255, 170, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '2px',
    fontSize: '0.7rem'
  },
  manifestRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.3rem',
    gap: '0.5rem'
  },
  manifestKey: {
    color: 'var(--text-muted)',
    fontWeight: 'bold'
  },
  snippet: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '1px 3px',
    borderRadius: '2px',
    color: 'var(--accent-green)',
    fontSize: '0.65rem'
  },
  navItem: (active) => ({
    padding: '0.8rem 1rem', cursor: 'pointer', borderLeft: '3px solid transparent',
    color: active ? 'var(--accent-green)' : 'var(--text-secondary)',
    backgroundColor: active ? 'rgba(0, 255, 170, 0.05)' : 'transparent',
    borderColor: active ? 'var(--accent-green)' : 'transparent',
    fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.7rem',
    transition: 'all 0.2s',
    marginBottom: '2px'
  }),
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    fontSize: '1rem', cursor: 'pointer', fontFamily: 'monospace',
    zIndex: 10
  },
  projectSelect: {
    width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)', color: 'var(--accent-green)',
    fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '1.5rem',
    outline: 'none'
  },
  table: {
    width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem'
  },
  th: {
    textAlign: 'left', borderBottom: '2px solid var(--border)', padding: '0.8rem', color: 'var(--accent-green)'
  },
  td: {
    borderBottom: '1px solid var(--border)', padding: '0.8rem'
  },
  entry: {
    padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    borderRadius: '4px',
    transition: 'border-color 0.2s',
  },
  highlighted: {
    padding: '1.5rem', backgroundColor: 'rgba(29,158,117,0.07)',
    border: '1px solid var(--accent-green)',
    borderRadius: '4px',
    boxShadow: '0 0 12px rgba(29,158,117,0.18)',
    transition: 'border-color 0.2s',
  },
  searchInput: {
    width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)', color: 'var(--text-primary)',
    fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none'
  },
  newBtn: {
    width: '100%', padding: '0.6rem', backgroundColor: 'rgba(0, 255, 170, 0.1)',
    border: '1px solid var(--accent-green)', color: 'var(--accent-green)',
    fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '1rem',
    cursor: 'pointer', transition: 'all 0.2s'
  },
  editIconBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '1rem', padding: '0 0.5rem', transition: 'color 0.2s'
  },
  editorContainer: {
    display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'
  },
  editorHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'
  },
  editorTitleInput: {
    width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-green)',
    border: '1px solid var(--border)', padding: '0.8rem', fontFamily: 'inherit', fontSize: '1.1rem',
    outline: 'none'
  },
  editorTextarea: {
    flex: 1, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', padding: '1rem', fontFamily: 'inherit',
    fontSize: '0.9rem', minHeight: '400px', resize: 'none', outline: 'none',
    lineHeight: '1.6'
  },
  editorFooter: {
    display: 'flex', gap: '1rem', marginTop: '0.5rem'
  },
  submitBtn: {
    padding: '0.8rem 1.5rem', border: 'none', color: 'var(--bg-primary)',
    fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px'
  },
  input: {
    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)',
    padding: '0.5rem', fontFamily: 'inherit'
  }
};

export default function WikiPanel({ projekt, onClose, selectedWikiEntry }) {
  const [activePage, setActivePage] = useState('doc');
  const [entries, setEntries] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [currentScope, setCurrentScope] = useState(projekt?.name || 'GLOBAL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [selectedPhase, setSelectedPhase] = useState('ALL');
  const [collapsedPhases, setCollapsedPhases] = useState({});

  const parsePhase = (tag) => {
    const match = tag?.match(/Phase\s+(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };
  const parsePhaseName = (tag) => {
    const match = tag?.match(/Phase\s+\d+\s*[—-]\s*(.+)/i);
    return match ? match[1].trim() : tag;
  };
  const parseTaskNumber = (title) => {
    const match = title?.match(/#(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
  };
  const isCompleted = (todo) => {
    if (!todo) return false;
    const status = todo.status?.toLowerCase();
    const title = todo.titel?.trim() || '';
    return status === 'done' || status === 'erledigt' || title.startsWith('✔') || title.startsWith('[x]') || title.startsWith('[X]');
  };

  const [containerWidth, setContainerWidth] = useState(() => {
    const saved = localStorage.getItem('wiki_container_width');
    return saved ? parseInt(saved, 10) : 1000;
  });
  useEffect(() => {
    localStorage.setItem('wiki_container_width', containerWidth);
  }, [containerWidth]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('wiki_sidebar_collapsed');
    return saved === 'true';
  });
  useEffect(() => {
    localStorage.setItem('wiki_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = containerWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(380, startWidth + deltaX * 2);
      const cappedWidth = Math.min(newWidth, window.innerWidth * 0.8);
      setContainerWidth(cappedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setSelectedPhase('ALL');
  }, [currentScope]);

  const projectList = React.useMemo(() => {
    return Array.from(new Set(allProjects.map(p => p.name))).filter(Boolean);
  }, [allProjects]);

  const isGlobal = !currentScope || currentScope === 'GLOBAL';

  const projectStats = React.useMemo(() => {
    const stats = {};
    projectList.forEach(name => {
      const projTodos = entries.filter(e => e.typ === 'todo' && e.projekt === name);
      const total = projTodos.length;
      const done = projTodos.filter(isCompleted).length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      
      const blocksCount = Math.round((percent / 100) * 5);
      const blocks = '█'.repeat(blocksCount) + '░'.repeat(5 - blocksCount);
      
      stats[name] = { total, done, percent, blocks };
    });
    return stats;
  }, [projectList, entries]);

  const filtered = React.useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = e.titel?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.inhalt?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activePage === 'shortcuts') return e.titel?.toLowerCase().includes('shortcut');
      
      const typeMatches = e.typ === activePage;
      const scopeMatches = isGlobal || e.projekt === currentScope;
      return typeMatches && scopeMatches;
    });
  }, [entries, searchQuery, activePage, currentScope, isGlobal]);

  const todos = React.useMemo(() => {
    if (activePage !== 'todo') return [];
    return [...filtered].sort((a, b) => {
      const phaseA = parsePhase(a.tag);
      const phaseB = parsePhase(b.tag);
      if (phaseA !== phaseB) return phaseA - phaseB;

      const numA = parseTaskNumber(a.titel);
      const numB = parseTaskNumber(b.titel);
      return numA - numB;
    });
  }, [activePage, filtered]);

  const filteredPhases = React.useMemo(() => {
    if (isGlobal) {
      return ['ALL', '1', '2', '3', '4', '5'];
    }
    const activePhases = Array.from(
      new Set(
        todos.map(t => parsePhase(t.tag).toString())
      )
    ).filter(p => p !== '0');
    return ['ALL', ...activePhases.sort()];
  }, [isGlobal, todos]);

  // Auto-switch page & scroll when opened from CommandPalette
  useEffect(() => {
    if (!selectedWikiEntry) return;

    if (selectedWikiEntry === 'Datenschutz & Modelle') {
      setActivePage('dsgvo');
      return;
    }

    if (entries.length === 0) return;
    
    // Find the entry to determine which section to show
    const target = entries.find(e => e.id?.toString() === selectedWikiEntry?.toString());
    if (target?.typ && ['doc', 'bug', 'todo', 'system'].includes(target.typ)) {
      setActivePage(target.typ);
    }
    // Give React one tick to re-render the correct section, then scroll
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-wiki-id="${selectedWikiEntry}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(id);
  }, [selectedWikiEntry, entries]); // re-run when entries load

  const TEMPLATES = {
    architecture: {
      titel: 'Architecture: [Name]',
      inhalt: '## Architecture Overview\n\n```mermaid\ngraph TD\n  A[Component A] --> B[Component B]\n  B --> C[(SurrealDB)]\n```\n\n### Data Flow\n1. ...\n2. ...'
    },
    setup: {
      titel: 'Setup: [Project]',
      inhalt: '## Setup Instructions\n\n### Prerequisites\n- Node.js v20+\n- SurrealDB v2.x\n\n### Installation\n```bash\nnpm install\ncp .env.example .env\nnpm run dev\n```'
    },
    adr: {
      titel: 'ADR: [Decision Title]',
      inhalt: '# ADR: [Title]\n\n- **Date**: ' + new Date().toISOString().split('T')[0] + '\n- **Status**: Proposed\n- **Context**: \n- **Decision**: \n- **Consequences**: \n'
    }
  };

  const applyTemplate = (key) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setEditingEntry(prev => ({ ...prev, titel: tpl.titel, inhalt: tpl.inhalt }));
    }
  };
  const [showNewModal, setShowNewModal] = useState(false);

  // Load all projects for the switcher (Live Sync)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await db.query('SELECT name FROM projekt ORDER BY name ASC');
        const data = res[0]?.result || res[0] || [];
        setAllProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch projects for wiki:', err);
      }
    };

    let liveQuery = null;
    let isMounted = true;

    const startLive = async () => {
      try {
        liveQuery = await db.live('projekt', () => {
          if (isMounted) loadProjects();
        });
        if (!isMounted) {
          liveQuery.kill().catch(() => {});
          liveQuery = null;
        }
      } catch (err) {
        console.warn('[Wiki] Project live sync failed:', err);
      }
    };

    loadProjects();
    startLive();

    return () => {
      isMounted = false;
      if (liveQuery) liveQuery.kill().catch(() => {});
    };
  }, []);

  // Sync currentScope when projekt prop changes (e.g. from DetailPanel context)
  useEffect(() => {
    if (projekt?.name) {
      setCurrentScope(projekt.name);
    }
  }, [projekt]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch based on scope: if GLOBAL show everything, else project + system
      const query = currentScope === 'GLOBAL' 
        ? 'SELECT * FROM wiki ORDER BY erstellt DESC'
        : 'SELECT * FROM wiki WHERE projekt = $name OR typ = "system" ORDER BY erstellt DESC';
        
      const res = await db.query(query, { name: currentScope });
      
      const data = res[0]?.result || res[0] || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Wiki load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentScope]);

  useEffect(() => {
    let liveQuery = null;
    let isMounted = true;

    const startLive = async () => {
      try {
        liveQuery = await db.live('wiki', ({ action, result }) => {
          if (!isMounted) return;
          if (currentScope === 'GLOBAL' || result.projekt === currentScope || result.typ === 'system') {
            load();
          }
        });
        if (!isMounted) {
          liveQuery.kill().catch(() => {});
          liveQuery = null;
        }
      } catch (err) {
        console.warn('[Wiki] Content live sync failed:', err);
      }
    };

    load();
    startLive();

    return () => {
      isMounted = false;
      if (liveQuery) liveQuery.kill().catch(() => {});
    };
  }, [load, currentScope]);

  const handleSaveEntry = async (entry) => {
    try {
      const data = {
        titel: entry.titel,
        inhalt: entry.inhalt,
        typ: entry.typ,
        geaendert: new Date().toISOString()
      };

      if (entry.id) {
        await db.query('UPDATE $id MERGE $data', { id: entry.id, data });
      } else {
        await db.query(`
          CREATE wiki SET 
            titel = $titel, 
            inhalt = $inhalt, 
            projekt = $projekt, 
            typ = $typ, 
            status = "open",
            erstellt = time::now(), 
            geaendert = time::now()
        `, {
          titel: entry.titel,
          inhalt: entry.inhalt,
          projekt: entry.typ === 'system' ? 'Global' : currentScope,
          typ: entry.typ
        });
      }
      setEditingEntry(null);
      setShowNewModal(false);
      load();
    } catch (err) {
      console.error('Save entry failed:', err);
      alert(`SAVE_FAILED: ${err.message}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sections = [
    { id: 'system', title: 'System', icon: '⚙️', type: 'system' },
    { id: 'dsgvo', title: 'Datenschutz & Modelle', icon: '🛡️', type: 'meta' },
    { id: 'doc', title: 'Docs', icon: '📄', type: 'project' },
    { id: 'bug', title: 'Bugs', icon: '🪲', type: 'project' },
    { id: 'todo', title: 'TODOs', icon: '✅', type: 'project' },
    { id: 'shortcuts', title: 'Shortcuts', icon: '⌨️', type: 'meta' },
  ];
  const getCount = (sectionId) => {
    return entries.filter(e => {
      const matchesSearch = e.titel.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.inhalt.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      // Shortcuts are special: they are just docs with "shortcut" in the title
      if (sectionId === 'shortcuts') return e.titel.toLowerCase().includes('shortcut');
      
      // Filter by type and scope
      const typeMatches = e.typ === sectionId;
      const scopeMatches = currentScope === 'GLOBAL' || e.projekt === currentScope;
      return typeMatches && scopeMatches;
    }).length;
  };

  const renderMarkdown = (content) => {
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (!inline && lang === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }

            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const renderContent = () => {
    if (editingEntry) {
      return (
        <div style={styles.editorContainer}>
          <div style={styles.editorHeader}>
            <h2 style={{ color: 'var(--accent-green)' }}>&gt; {editingEntry.id ? 'EDIT_ENTRY' : 'CREATE_ENTRY'}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                style={{ ...styles.input, width: 'auto' }}
                value={editingEntry.typ}
                onChange={e => setEditingEntry({ ...editingEntry, typ: e.target.value })}
              >
                <option value="doc">DOC</option>
                <option value="bug">BUG</option>
                <option value="todo">TODO</option>
                <option value="system">SYSTEM</option>
              </select>
              {!editingEntry.id && (
                <select 
                  style={{ ...styles.input, width: 'auto', border: '1px dashed var(--accent-blue)', color: 'var(--accent-blue)' }}
                  onChange={e => applyTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>SELECT_TEMPLATE</option>
                  <option value="architecture">📐 ARCHITECTURE</option>
                  <option value="setup">⚙️ SETUP</option>
                  <option value="adr">💡 ADR</option>
                </select>
              )}
            </div>
          </div>
          
          <input 
            style={styles.editorTitleInput}
            value={editingEntry.titel}
            onChange={e => setEditingEntry({ ...editingEntry, titel: e.target.value })}
            placeholder="ENTRY_TITLE"
          />

          <textarea 
            style={styles.editorTextarea}
            value={editingEntry.inhalt}
            onChange={e => setEditingEntry({ ...editingEntry, inhalt: e.target.value })}
            placeholder="MARKDOWN_CONTENT..."
          />

          <div style={styles.editorFooter}>
            <button 
              style={{ ...styles.submitBtn, backgroundColor: 'var(--accent-green)' }}
              onClick={() => handleSaveEntry(editingEntry)}
            >
              [ SAVE_CHANGES ]
            </button>
            <button 
              style={{ ...styles.submitBtn, backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              onClick={() => setEditingEntry(null)}
            >
              [ DISCARD ]
            </button>
          </div>
        </div>
      );
    }

    if (activePage === 'dsgvo') {
      return (
        <div className="wiki-markdown">
          <h2 style={{ textTransform: 'uppercase', marginBottom: '1.5rem' }}>🛡️ DATENSCHUTZ & MODELLE</h2>
          <div className="markdown-body">
            <p>KAiOSS ist als <strong>Privacy-First AI Operating System</strong> konzipiert. Deine Daten gehören dir.</p>
            
            <h3>🟢 GREEN: Lokal / EU (Maximaler Schutz)</h3>
            <ul>
              <li><strong>Ollama:</strong> Alle Daten bleiben auf deiner Hardware. Keine Übertragung nach außen.</li>
              <li><strong>Mistral (EU):</strong> Datenverarbeitung in Europa unter strengen DSGVO-Auflagen.</li>
            </ul>

            <h3>🟡 YELLOW: USA (Standard Schutz)</h3>
            <ul>
              <li><strong>Claude (Anthropic) / Gemini (Google):</strong> Datenverarbeitung in den USA. Geschützt durch das <em>Data Privacy Framework (DPF)</em>.</li>
            </ul>

            <h3>🔴 RED: Drittstaaten (Kritisch)</h3>
            <ul>
              <li><strong>DeepSeek / Qwen (China):</strong> Verarbeitung in Ländern ohne Angemessenheitsbeschluss. Nutzung nur für unkritische Daten empfohlen.</li>
            </ul>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(29, 158, 117, 0.1)', border: '1px solid var(--accent-green)' }}>
              <strong>HINWEIS:</strong> Diese Einstufung dient der Orientierung. Bitte beachte die jeweiligen Nutzungsbedingungen der Anbieter.
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 'todo') {
      // TODO: Phase-Dependency-Graph (vis.js oder D3) — Phase 2 Feature

      const totalProgress = getTotalProgress(todos);

      const renderProjectPills = () => (
        <div 
          className="wiki-pills-container"
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            marginBottom: '1.2rem',
            fontFamily: 'monospace',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'thin'
          }}
        >
          <button
            onClick={() => setCurrentScope('GLOBAL')}
            className={`wiki-project-pill ${currentScope === 'GLOBAL' ? 'active' : ''}`}
            style={{
              backgroundColor: currentScope === 'GLOBAL' ? 'rgba(0, 255, 170, 0.05)' : 'transparent',
              border: currentScope === 'GLOBAL' ? '1px solid var(--accent, var(--accent-green, #00ffaa))' : '1px solid var(--border)',
              color: currentScope === 'GLOBAL' ? 'var(--accent, var(--accent-green, #00ffaa))' : 'var(--text-muted)',
              padding: '0.3rem 0.6rem',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              borderRadius: '2px',
              transition: 'all 0.2s',
              outline: 'none',
              flexShrink: 0
            }}
          >
            [ ALL PROJECTS ]
          </button>
          {projectList.map(name => {
            const isActive = currentScope === name;
            return (
              <button
                key={name}
                onClick={() => setCurrentScope(name)}
                className={`wiki-project-pill ${isActive ? 'active' : ''}`}
                style={{
                  backgroundColor: isActive ? 'rgba(0, 255, 170, 0.05)' : 'transparent',
                  border: isActive ? '1px solid var(--accent, var(--accent-green, #00ffaa))' : '1px solid var(--border)',
                  color: isActive ? 'var(--accent, var(--accent-green, #00ffaa))' : 'var(--text-muted)',
                  padding: '0.3rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontFamily: 'inherit',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                [ {name} ]
              </button>
            );
          })}
        </div>
      );

      const renderProgressHUD = () => (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '0.8rem 1.2rem',
          marginBottom: '1.5rem',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          letterSpacing: '1px'
        }}>
          <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <span>ROADMAP: {totalProgress.done}/{totalProgress.total}</span>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${totalProgress.percent}%`,
                height: '100%',
                backgroundColor: 'var(--accent, var(--accent-green, #00ffaa))',
                boxShadow: '0 0 10px rgba(0, 255, 170, 0.5)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ fontWeight: 'bold' }}>{totalProgress.percent}%</span>
          </div>
        </div>
      );

      const renderPhasePills = () => {
        return (
          <div 
            className="wiki-pills-container"
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'thin'
            }}
          >
            {filteredPhases.map(p => {
              const isActive = selectedPhase === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  style={{
                    backgroundColor: isActive ? 'rgba(0, 255, 170, 0.05)' : 'transparent',
                    border: isActive ? '1px solid var(--accent, var(--accent-green, #00ffaa))' : '1px solid var(--border)',
                    color: isActive ? 'var(--accent, var(--accent-green, #00ffaa))' : 'var(--text-muted)',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'inherit',
                    borderRadius: '2px',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 0 8px rgba(0, 255, 170, 0.15)' : 'none',
                    outline: 'none',
                    flexShrink: 0
                  }}
                >
                  [ {p === 'ALL' ? 'ALL' : `P${p}`} ]
                </button>
              );
            })}
          </div>
        );
      };

      const renderProjectOverview = () => {
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            fontFamily: 'monospace',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            padding: '1.2rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ color: 'var(--accent-orange)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              &gt; PROJECT ROADMAP OVERVIEW
            </div>
            {projectList.map(name => {
              const stats = projectStats[name] || { total: 0, done: 0, percent: 0, blocks: '░░░░░' };
              return (
                <div
                  key={name}
                  onClick={() => setCurrentScope(name)}
                  className="wiki-project-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.8rem',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                    <span>📁</span>
                    <span style={{ fontWeight: 'bold' }}>{name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{stats.done}/{stats.total} DONE</span>
                    <span style={{ color: 'var(--accent, var(--accent-green, #00ffaa))' }}>[{stats.blocks}]</span>
                    <span style={{ fontWeight: 'bold', width: '35px', textAlign: 'right' }}>{stats.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      };

      const getPhaseTitle = (phaseNum) => {
        const firstTodo = todos.find(t => parsePhase(t.tag) === phaseNum);
        return firstTodo ? firstTodo.tag : `Phase ${phaseNum}`;
      };

      const isCollapsed = (phaseNum, phaseTodos) => {
        if (collapsedPhases[phaseNum] !== undefined) {
          return collapsedPhases[phaseNum];
        }
        const progress = getPhaseProgress(todos, phaseNum);
        return progress.percent > 0;
      };

      const togglePhase = (phaseNum, phaseTodos) => {
        setCollapsedPhases(prev => ({
          ...prev,
          [phaseNum]: !isCollapsed(phaseNum, phaseTodos)
        }));
      };

      const renderTaskCard = (entry) => {
        const completed = isCompleted(entry);
        return (
          <div
            key={entry.id}
            data-wiki-id={entry.id?.toString()}
            style={{
              padding: '0.8rem 1rem',
              backgroundColor: completed ? 'rgba(0, 255, 170, 0.01)' : 'rgba(255, 255, 255, 0.01)',
              border: completed ? '1px dashed rgba(0, 255, 170, 0.15)' : '1px solid var(--border)',
              borderRadius: '2px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              transition: 'all 0.2s',
              opacity: completed ? 0.75 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <span style={{ color: completed ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                {completed ? '[✔]' : '[ ]'}
              </span>
              <span style={{ color: completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: completed ? 'line-through' : 'none' }}>
                {entry.titel}
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.1rem 0.3rem' }}>
              [ SYNCED ]
            </span>
          </div>
        );
      };

      const renderAccordion = (phaseNum, phaseTodos) => {
        const phaseTitle = getPhaseTitle(phaseNum);
        const collapsed = isCollapsed(phaseNum, phaseTodos);
        const progress = getPhaseProgress(todos, phaseNum);

        return (
          <div key={phaseNum} style={{ marginBottom: '1rem' }}>
            <div
              onClick={() => togglePhase(phaseNum, phaseTodos)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent, var(--accent-green, #00ffaa))' }}>
                <span>{collapsed ? '▶' : '▼'}</span>
                <span style={{ fontWeight: 'bold' }}>{phaseTitle}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {progress.done}/{progress.total} DONE ({progress.percent}%)
              </div>
            </div>

            {!collapsed && (
              <div style={{
                padding: '0.5rem 0 0.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                borderLeft: '1px dotted var(--border)',
                marginTop: '0.2rem'
              }}>
                {phaseTodos.map(renderTaskCard)}
              </div>
            )}
          </div>
        );
      };

      // Group todos by phase for ALL view, or render specific phase flat
      const phaseNum = selectedPhase === 'ALL' ? null : parseInt(selectedPhase, 10);
      const uniquePhases = Array.from(new Set(todos.map(t => parsePhase(t.tag)))).sort((a, b) => a - b);

      return (
        <div className="wiki-markdown">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ textTransform: 'uppercase', margin: 0 }}>
              {sections.find(p => p.id === activePage)?.icon} TODO ROADMAP
            </h2>
            {searchQuery && (
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)' }}>
                FILTERING: "{searchQuery}"
              </div>
            )}
          </div>

          {renderProjectPills()}
          {renderProgressHUD()}
          {renderPhasePills()}

          {loading ? (
            <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
          ) : todos.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>&gt; NO TODOS FOUND FOR [{currentScope}]</div>
          ) : isGlobal && selectedPhase === 'ALL' ? (
            renderProjectOverview()
          ) : selectedPhase === 'ALL' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {uniquePhases.map(ph => {
                const phaseTodos = todos.filter(t => parsePhase(t.tag) === ph);
                return renderAccordion(ph, phaseTodos);
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todos.filter(t => parsePhase(t.tag) === phaseNum).map(renderTaskCard)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="wiki-markdown">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ textTransform: 'uppercase', margin: 0 }}>
            {sections.find(p => p.id === activePage)?.icon} {activePage === 'system' ? 'System Rules' : activePage + 's'}
          </h2>
          {searchQuery && (
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)' }}>
              FILTERING: "{searchQuery}" ({filtered.length} matches)
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>&gt; NO ENTRIES FOUND FOR [{currentScope}]</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filtered.map(entry => (
              <div
                key={entry.id}
                data-wiki-id={entry.id?.toString()}
                style={
                  selectedWikiEntry && entry.id?.toString() === selectedWikiEntry?.toString()
                    ? styles.highlighted
                    : styles.entry
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0, 255, 170, 0.1)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--accent-green)' }}>{entry.titel}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      style={styles.editIconBtn}
                      onClick={() => setEditingEntry(entry)}
                      title="Edit Entry"
                    >
                      ✎
                    </button>
                    {entry.prioritaet && (
                      <span style={{ 
                        fontSize: '0.6rem', 
                        padding: '0.1rem 0.4rem', 
                        border: '1px solid currentColor',
                        color: entry.prioritaet === 'high' ? 'var(--error)' : 'var(--accent-orange)'
                      }}>
                        {entry.prioritaet.toUpperCase()}
                      </span>
                    )}
                    <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                      {entry.typ.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="markdown-body" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {renderMarkdown(entry.inhalt)}
                </div>

                <div style={{ marginTop: '1.2rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px dotted var(--border)', paddingTop: '0.5rem' }}>
                  PROJEKT: {entry.projekt} // STATUS: {entry.status?.toUpperCase() || 'N/A'} // UPDATED: {new Date(entry.geaendert).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.container, width: `clamp(380px, ${containerWidth}px, 80vw)`, maxWidth: 'none' }}>
        <div className="wiki-resize-handle" onMouseDown={handleMouseDown} />
        <button onClick={onClose} style={styles.closeBtn}>[ ESC_CLOSE ]</button>
        
        <aside style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '0px' : '260px',
          minWidth: sidebarCollapsed ? '0px' : '260px',
          padding: sidebarCollapsed ? '0px' : '1.5rem',
          opacity: sidebarCollapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, opacity 0.2s ease',
          borderRight: sidebarCollapsed ? 'none' : '1px solid var(--border)'
        }}>
          <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem', letterSpacing: '1px' }}>KAiOSS_WIKI</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginBottom: '1.5rem' }}>v1.4.0_STABLE</div>
          
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.3rem' }}>ACTIVE_CONTEXT:</div>
          <select 
            style={styles.projectSelect} 
            value={currentScope} 
            onChange={(e) => setCurrentScope(e.target.value)}
          >
            <option value="GLOBAL">--- ALLE PROJEKTE ---</option>
            <option value="KAiOSS">KAiOSS (Global)</option>
            {allProjects.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>

          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="SEARCH_WIKI..." 
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            style={styles.newBtn}
            onClick={() => {
              setEditingEntry({ typ: activePage === 'system' || activePage === 'shortcuts' ? 'doc' : activePage, titel: '', inhalt: '' });
            }}
          >
            [ + NEW_ENTRY ]
          </button>

          {sections.map(section => (
            <div 
              key={section.id} 
              style={styles.navItem(activePage === section.id)}
              onClick={() => setActivePage(section.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flex: 1 }}>
                <span>{section.icon}</span> {section.title}
              </div>
              {section.type !== 'meta' && (
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>[{getCount(section.id)}]</span>
              )}
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '1rem', border: '1px dashed var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--accent-orange)', marginBottom: '0.3rem' }}>TERMINAL_STATUS:</div>
            &gt; Live Queries: Active<br/>
            &gt; Context: {currentScope}<br/>
            &gt; User: {import.meta.env.VITE_SURREAL_USER || 'root'}
          </div>
          {projekt?.manifest && (
            <div style={styles.manifestSidebar}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.2rem', marginTop: '1rem' }}>SYSTEM_MANIFEST</div>
              <div style={styles.manifestRow}>
                <span style={styles.manifestKey}>stack</span>
                <span style={{ color: 'var(--text-primary)' }}>{projekt.manifest.stack?.framework} / {projekt.manifest.stack?.db}</span>
              </div>
              <div style={styles.manifestRow}>
                <span style={styles.manifestKey}>port</span>
                <span style={{ color: 'var(--text-primary)' }}>:{projekt.manifest.ports?.dev}</span>
              </div>
              <div style={styles.manifestRow}>
                <span style={styles.manifestKey}>entry</span>
                <span style={{ color: 'var(--text-primary)' }}>{projekt.manifest.entry}</span>
              </div>
              <div style={styles.manifestRow}>
                <span style={styles.manifestKey}>start</span>
                <code style={styles.snippet}>{projekt.manifest.start}</code>
              </div>
            </div>
          )}
        </aside>

        <main style={{
          ...styles.main,
          padding: '3.5rem 3rem 3rem 4.5rem',
          position: 'relative',
          transition: 'padding 0.3s ease'
        }}>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: sidebarCollapsed ? 'var(--accent-orange)' : 'var(--accent-green)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '2px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s'
            }}
            title={sidebarCollapsed ? "Sidebar einblenden [ ≡ ]" : "Sidebar ausblenden [ ≡ ]"}
            className="project-pill"
          >
            [ ≡ ]
          </button>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
