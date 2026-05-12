import React, { useState, useEffect, useCallback } from 'react';
import { useSurrealDB } from './hooks/useSurrealDB';
import { useWikiStats } from './hooks/useWikiStats';
import { useToast } from './hooks/useToast';
import { useLog } from './context/LogContext';
import { COLUMNS } from './constants';
import db from './lib/db';
import Board from './components/Board';
import DetailPanel from './components/DetailPanel';
import Navbar from './components/Navbar';
import WikiPanel from './components/WikiPanel';
import TodoPanel from './components/TodoPanel';
import CreateProjectModal from './components/CreateProjectModal';
import TerminalLog from './components/TerminalLog';
import CommandPalette from './components/CommandPalette';
import KaiAssistant from './components/KaiAssistant';
import ProjectHeader from './components/ProjectHeader';
import ObsidianSync from './components/ObsidianSync';
import WelcomeScreen from './components/WelcomeScreen';

export default function App() {
  const { projects, dbStatus, dbError, loading: isLoading } = useSurrealDB();
  const { toasts, showToast } = useToast();
  const { logEvent } = useLog();

  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('active_project_id'));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  const [showWiki, setShowWiki] = useState(false);
  const [showTodo, setShowTodo] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedWikiEntry, setSelectedWikiEntry] = useState(null);
  const [showObsidianSync, setShowObsidianSync] = useState(false);

  // Single wiki live subscription via dedicated hook
  const wikiStats = useWikiStats((res) => logEvent(res.action, 'wiki', res.result));

  // Persistence: Save active project
  useEffect(() => {
    if (selectedProjectId) localStorage.setItem('active_project_id', selectedProjectId);
    else localStorage.removeItem('active_project_id');
  }, [selectedProjectId]);

  // Projekt live subscription for terminal logging
  useEffect(() => {
    let liveId = null;
    db.live('projekt', (res) => logEvent(res.action, 'projekt', res.result))
      .then(uuid => { liveId = uuid; })
      .catch(err => console.warn('[App] db.live projekt failed:', err));
    return () => { if (liveId) db.kill(liveId).catch(() => {}); };
  }, [logEvent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === '?') {
        setShowWiki(prev => !prev);
        logEvent('view', 'wiki', null, 'Wiki toggled');
      }
      if (e.key === 't' || e.key === 'T') {
        setShowTodo(prev => !prev);
        logEvent('view', 'todo', null, 'Todo panel toggled');
      }
      if (e.key === 'Escape') {
        setShowWiki(false);
        setShowTodo(false);
        setShowCreateModal(false);
        setSelectedProjectId(null);
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logEvent]);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId?.toString());
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const openWikiEntry = useCallback((entry) => {
    setSelectedWikiEntry(entry.id?.toString());
    setShowWiki(true);
    setShowCommandPalette(false);
  }, []);

  const handleDragStart = (e, id) => e.dataTransfer.setData('text/plain', id);
  const handleDrop = async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || id === 'drag') return;

    try {
      await db.query('UPDATE type::thing($id) SET status = $status, updated = time::now()', { id, status });
      showToast('Project moved successfully', 'success');
    } catch (err) {
      showToast('Move failed', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <Navbar 
        theme={theme} toggleTheme={toggleTheme} dbStatus={dbStatus} 
        onWikiOpen={() => setShowWiki(true)} onTodoOpen={() => setShowTodo(true)}
        onCreateOpen={() => setShowCreateModal(true)} onObsidianSync={() => setShowObsidianSync(true)}
        showToast={showToast}
      />

      {dbError && <div className="error-banner">Error: {dbError}</div>}

      <ProjectHeader activeProject={selectedProject} onWikiOpen={() => setShowWiki(true)} onNotify={showToast} />

      {projects.length === 0 && !isLoading ? (
        <WelcomeScreen dbStatus={dbStatus} onStart={() => setShowCreateModal(true)} />
      ) : (
        <Board
          columns={COLUMNS} projects={projects} isLoading={isLoading}
          onDragStart={handleDragStart} onDrop={handleDrop}
          onCardClick={setSelectedProjectId} wikiStats={wikiStats}
        />
      )}

      <KaiAssistant project={selectedProject} />

      <footer className="footer-terminal">(c) 2026 ANDREAS BADER // {'>'} kaioss::ready // TERMINAL_UI</footer>
      
      <TerminalLog />
      {showCommandPalette && (
        <CommandPalette 
          projects={projects} onSelectProject={setSelectedProjectId}
          onClose={() => setShowCommandPalette(false)} onOpenWikiEntry={openWikiEntry}
        />
      )}
      
      <DetailPanel 
        projectId={selectedProjectId} projects={projects} isOpen={!!selectedProjectId} 
        onClose={() => setSelectedProjectId(null)} onSelectProject={setSelectedProjectId} onNotify={showToast}
      />

      {showWiki && (
        <WikiPanel projekt={selectedProject} selectedWikiEntry={selectedWikiEntry}
          onClose={() => { setShowWiki(false); setSelectedWikiEntry(null); }}
        />
      )}
      {showTodo && <TodoPanel onClose={() => setShowTodo(false)} />}
      {showObsidianSync && <ObsidianSync onClose={() => setShowObsidianSync(false)} onNotify={showToast} />}
      
      <CreateProjectModal 
        isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onNotify={showToast}
        onCreate={(proj) => { setSelectedProjectId(proj.id); setShowWiki(true); }}
      />

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✅' : '❌'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
