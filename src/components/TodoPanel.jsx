import React, { useState, useEffect, useRef, useCallback } from 'react';
import db from '../lib/db';

export default function TodoPanel({ onClose }) {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('alle');
  const [newTodo, setNewTodo] = useState('');
  const [kaiPrompt, setKaiPrompt] = useState('');
  const [kaiLoading, setKaiLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('todoPanelPos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 420, y: 80 };
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const SNAP_POINTS = React.useMemo(() => [
    { x: window.innerWidth - 320, y: 80 },
    { x: window.innerWidth - 320, y: window.innerHeight - 400 },
    { x: 20, y: 80 },
  ], []);

  const load = useCallback(async () => {
    try {
      const result = await db.query(
        'SELECT * FROM wiki WHERE typ = $typ ORDER BY prioritaet ASC, erstellt DESC',
        { typ: 'todo' }
      );
      const data = result[0]?.result || result[0] || [];
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Todo load failed:', err);
    }
  }, []);

  useEffect(() => {
    let liveQuery = null;
    let isMounted = true;

    const startLive = async () => {
      try {
        liveQuery = await db.live('wiki', ({ result }) => {
          if (isMounted && result?.typ === 'todo') load();
        });
        if (!isMounted) {
          liveQuery.kill().catch(() => {});
          liveQuery = null;
        }
      } catch (err) {
        console.warn('[Todo] Live sync failed:', err);
      }
    };

    load();
    startLive();

    return () => {
      isMounted = false;
      if (liveQuery) liveQuery.kill().catch(() => {});
    };
  }, [load]);

  const toggleTodo = async (id, currentStatus) => {
    await db.query('UPDATE $id SET status = $status, geaendert = time::now()', {
      id,
      status: currentStatus === 'done' ? 'open' : 'done'
    });
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await db.query(
      'CREATE wiki SET projekt=$p, typ=$t, titel=$ti, inhalt=$i, status=$s, prioritaet=$pr, erstellt=time::now(), geaendert=time::now()',
      {
        p: filter === 'alle' ? 'KAiOSS' : filter,
        t: 'todo',
        ti: newTodo,
        i: '',
        s: 'open',
        pr: 'medium'
      }
    );
    setNewTodo('');
  };

  const askKAi = async () => {
    if (!kaiPrompt.trim()) return;
    setKaiLoading(true);
    try {
      const currentProj = filter === 'alle' ? 'KAiOSS' : filter;
      
      // Fetch relevant wiki context
      const wikiRes = await db.query(
        'SELECT titel, inhalt FROM wiki WHERE (projekt = $p OR typ = "system") AND typ != "todo" LIMIT 3',
        { p: currentProj }
      );
      const context = wikiRes[0]?.result || [];
      const contextStr = context.map(c => `[WIKI: ${c.titel}]\n${c.inhalt.substring(0, 300)}`).join('\n---\n');

      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen2.5-coder:latest',
          prompt: `Du bist KAi, ein Projekt-Assistent. Nutze den folgenden Wiki-Kontext um die Anfrage zu verstehen.\n\nKONTEXT:\n${contextStr}\n\nANFRAGE: ${kaiPrompt}\n\nErstelle daraus ein prägnantes TODO (NUR den Titel des Todos zurückgeben):`,
          stream: false
        })
      });
      const data = await res.json();
      if (data.response) {
        await db.query(
          'CREATE wiki SET projekt=$p, typ=$t, titel=$ti, inhalt=$i, status=$s, prioritaet=$pr, erstellt=time::now(), geaendert=time::now()',
          { p: currentProj, t: 'todo', ti: data.response.trim().replace(/^"|"$/g, ''), i: '', s: 'open', pr: 'medium' }
        );
        setKaiPrompt('');
      }
    } catch (err) {
      console.error('KAi failed:', err);
    } finally {
      setKaiLoading(false);
    }
  };

  const onMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setDragging(true);
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
    const onUp = () => {
      setDragging(false);
      // Magnetic Snap Logic
      const nearest = SNAP_POINTS.find(p => 
        Math.hypot(pos.x - p.x, pos.y - p.y) < 80
      );
      const finalPos = nearest || pos;
      setPos(finalPos);
      localStorage.setItem('todoPanelPos', JSON.stringify(finalPos));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, pos, SNAP_POINTS]);

  const projects = ['alle', ...new Set(todos.map(t => t.projekt))];
  const filteredTodos = filter === 'alle' ? todos : todos.filter(t => t.projekt === filter);

  const styles = {
    panel: {
      position: 'fixed', left: pos.x, top: pos.y,
      width: '300px', maxHeight: '500px',
      backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1500,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'monospace',
      transition: dragging ? 'none' : 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    },
    header: {
      padding: '0.8rem 1rem', borderBottom: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: 'grab', backgroundColor: 'var(--bg-secondary)'
    },
    filterBar: {
      display: 'flex', gap: '0.5rem', padding: '0.5rem', overflowX: 'auto',
      borderBottom: '1px solid var(--border)', fontSize: '0.7rem'
    },
    filterTab: (active) => ({
      padding: '0.2rem 0.6rem', cursor: 'pointer',
      border: '1px solid', borderColor: active ? 'var(--accent-green)' : 'transparent',
      color: active ? 'var(--accent-green)' : 'var(--text-muted)'
    }),
    list: {
      flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem'
    },
    todoItem: {
      display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem'
    },
    checkbox: (done) => ({
      width: '14px', height: '14px', border: '1px solid var(--border)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--accent-green)', backgroundColor: done ? 'rgba(0,255,170,0.1)' : 'transparent'
    }),
    inputArea: {
      padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)'
    },
    input: {
      width: '100%', background: 'transparent', border: '1px solid var(--border)',
      color: 'var(--text-primary)', padding: '0.5rem', fontSize: '0.8rem', outline: 'none'
    }
  };

  return (
    <div style={{ ...styles.panel, height: collapsed ? 'auto' : '500px' }} onMouseDown={onMouseDown}>
      <div style={styles.header} className="drag-handle" onDoubleClick={() => setCollapsed(!collapsed)}>
        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>TODO_CLI</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            [{collapsed ? '+' : '-'}]
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>[X]</button>
        </div>
      </div>
      
      {!collapsed && (
        <>
          <div style={styles.filterBar}>
            {projects.map(p => (
              <div key={p} style={styles.filterTab(filter === p)} onClick={() => setFilter(p)}>
                {p.toUpperCase()} [{p === 'alle' ? todos.length : todos.filter(t => t.projekt === p).length}]
              </div>
            ))}
          </div>

          <div style={{ padding: '0.8rem 1rem 0.4rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>PROJECT_PROGRESS</span>
              <span>{Math.round((todos.filter(t => t.status === 'done').length / (todos.length || 1)) * 100)}%</span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--accent-green)', 
                width: `${(todos.filter(t => t.status === 'done').length / (todos.length || 1)) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={styles.list}>
            {filteredTodos.map(todo => (
              <div key={todo.id} style={styles.todoItem}>
                <div 
                  style={styles.checkbox(todo.status === 'done')} 
                  onClick={() => toggleTodo(todo.id, todo.status)}
                >
                  {todo.status === 'done' ? '●' : '○'}
                </div>
                <span style={{ 
                  color: todo.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: todo.status === 'done' ? 'line-through' : 'none',
                  flex: 1
                }}>
                  {todo.titel}
                </span>
                <span style={{ fontSize: '0.6rem', color: todo.prioritaet === 'high' ? 'var(--error)' : 'var(--text-muted)' }}>
                  {todo.prioritaet.toUpperCase()}
                </span>
              </div>
            ))}
            {filteredTodos.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>&gt; NO TODOS</div>
            )}
          </div>

          <form style={styles.inputArea} onSubmit={addTodo}>
            <input 
              style={styles.input} 
              placeholder="+ Neues Todo..." 
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
          </form>

          <div style={{ ...styles.inputArea, borderTop: '2px solid var(--border)', backgroundColor: 'rgba(0, 255, 170, 0.02)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>KAi_PROMPT:</span>
              <input 
                style={{ ...styles.input, border: 'none', padding: '0.2rem' }} 
                placeholder="Was soll ich tun?" 
                value={kaiPrompt}
                onChange={(e) => setKaiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askKAi()}
              />
              <button 
                onClick={askKAi} 
                disabled={kaiLoading}
                style={{ background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', fontSize: '0.6rem', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
              >
                {kaiLoading ? '...' : 'GENERATE'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
