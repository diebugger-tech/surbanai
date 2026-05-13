import React, { useState, useEffect, useRef, useCallback } from 'react';
import db from '../lib/db';
import { COLUMNS } from '../constants';

export default function DetailPanel({ projectId, projects = [], isOpen, onClose, onSelectProject, onNotify }) {
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({ desc: '', tags: '', status: '', cmd_start: '', cmd_stop: '' });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const isDirty = useRef(false); // tracks whether form has unsaved changes
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmDelete) setShowConfirmDelete(false);
        else onClose();
      }
      
      if (isOpen && projects.length > 0 && !showConfirmDelete) {
        const currentIndex = projects.findIndex(p => p.id.toString() === projectId?.toString());
        if (e.key.toLowerCase() === 'j') {
          const nextIndex = (currentIndex + 1) % projects.length;
          onSelectProject(projects[nextIndex].id);
        }
        if (e.key.toLowerCase() === 'k') {
          const prevIndex = (currentIndex - 1 + projects.length) % projects.length;
          onSelectProject(projects[prevIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isOpen, projects, projectId, onSelectProject, showConfirmDelete]);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setShowConfirmDelete(false);
      isDirty.current = false; // reset dirty flag when switching projects
      setAutoSaveStatus(null);
      db.query(`SELECT * FROM ${projectId.toString()}`)
        .then(res => {
          if (res && res[0] && res[0][0]) {
            const row = res[0][0];
            setData(row);
            setFormData({
              desc: row.desc || '',
              tags: Array.isArray(row.tags) ? row.tags.join(', ') : (row.tags || ''),
              status: row.status || 'backlog',
              cmd_start: row.cmd_start || 'make dev',
              cmd_stop: row.cmd_stop || 'make stop'
            });
          }
        })
        .catch(err => {
          console.error('Error fetching detail:', err);
          onNotify('Failed to load project data', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId, onNotify]);

  // Auto-save: debounced 500ms, fires only when form is dirty
  useEffect(() => {
    if (!isDirty.current || !projectId) return;
    const timer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        await db.query(
          `UPDATE type::thing($id) SET
            desc = $desc, tags = $tags, status = $status,
            cmd_start = $cmd_start, cmd_stop = $cmd_stop,
            updated = time::now()`,
          { id: projectId.toString(), desc: formData.desc, tags: tagsArray,
            status: formData.status, cmd_start: formData.cmd_start, cmd_stop: formData.cmd_stop }
        );
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (!projectId) return;
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      await db.query(
        `UPDATE type::thing($id) SET
          desc = $desc,
          tags = $tags,
          status = $status,
          cmd_start = $cmd_start,
          cmd_stop = $cmd_stop,
          updated = time::now()`,
        {
          id: projectId.toString(),
          desc: formData.desc,
          tags: tagsArray,
          status: formData.status,
          cmd_start: formData.cmd_start,
          cmd_stop: formData.cmd_stop,
        }
      );
      isDirty.current = false;
      onNotify('Changes saved');
    } catch (err) {
      console.error('Update failed:', err);
      onNotify('Save failed', 'error');
    }
  }, [formData, projectId, onNotify]);

  const handleDelete = async () => {
    if (!projectId) return;
    try {
      await db.query('DELETE type::thing($id)', { id: projectId.toString() });
      onNotify('Project deleted', 'success');
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
      onNotify('Delete failed', 'error');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-overlay)', zIndex: 999
    },
    panel: {
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px',
      backgroundColor: 'var(--bg-primary)', borderLeft: '2px solid var(--border)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', padding: '2rem',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-out', boxShadow: '-5px 0 20px var(--shadow)',
      overflowY: 'auto'
    },
    closeBtn: {
      position: 'absolute', top: '1rem', right: '1rem',
      background: 'transparent', border: 'none', color: 'var(--error)',
      fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'monospace'
    },
    content: {
      display: 'flex', flexDirection: 'column', gap: '1.5rem',
      color: 'var(--text-primary)'
    },
    label: (color = 'var(--accent-green)') => ({
      color: color, fontSize: '0.8rem'
    }),
    input: {
      backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)',
      padding: '0.5rem', fontFamily: 'inherit'
    },
    textarea: {
      backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)',
      padding: '0.5rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical'
    },
    actionBtn: (bgColor) => ({
      flex: 1, backgroundColor: bgColor, color: 'var(--bg-primary)', border: 'none',
      padding: '0.6rem', fontWeight: 'bold', cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 0.2s'
    }),
    saveBtn: {
      backgroundColor: 'var(--accent-blue)', color: 'var(--bg-primary)', border: 'none',
      padding: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
      fontFamily: 'inherit'
    },
    deleteBtn: {
      marginTop: '1rem', backgroundColor: 'transparent', color: 'var(--error)', 
      border: '1px solid var(--error)', padding: '0.6rem', cursor: 'pointer',
      fontFamily: 'inherit', opacity: 0.7, transition: 'all 0.2s'
    },
    terminalBox: {
      marginTop: '1rem', backgroundColor: 'var(--bg-primary)', padding: '1rem',
      border: '1px solid var(--border)', borderRadius: '4px'
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.panel}>
        <button onClick={onClose} style={styles.closeBtn}>[X]</button>
        
        {loading || !data ? (
          <div style={{ color: 'var(--accent-green)' }}>&gt; LOADING DATA...</div>
        ) : (
          <div style={styles.content}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{data.icon}</div>
              <h2 style={{ margin: 0, color: 'var(--accent-green)', letterSpacing: '1px' }}>{data.name}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>ID: {data.id.toString()}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>STACK: {data.stack}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={styles.label()}>&#62; DESCRIPTION</label>
              <textarea
                value={formData.desc}
                onChange={e => { isDirty.current = true; setFormData({ ...formData, desc: e.target.value }); }}
                style={styles.textarea}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={styles.label()}>&#62; TAGS (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => { isDirty.current = true; setFormData({ ...formData, tags: e.target.value }); }}
                style={styles.input}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={styles.label()}>&#62; START CMD</label>
                <input type="text" value={formData.cmd_start} onChange={e => { isDirty.current = true; setFormData({ ...formData, cmd_start: e.target.value }); }} style={styles.input} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={styles.label('var(--error)')}>&#62; STOP CMD</label>
                <input type="text" value={formData.cmd_stop} onChange={e => { isDirty.current = true; setFormData({ ...formData, cmd_stop: e.target.value }); }} style={styles.input} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={styles.label()}>&#62; STATUS</label>
              <select
                value={formData.status}
                onChange={e => { isDirty.current = true; setFormData({ ...formData, status: e.target.value }); }}
                style={{ ...styles.input, cursor: 'pointer' }}
              >
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              border: '1px solid var(--accent-orange)',
              padding: '0.8rem',
              fontSize: '0.7rem',
              color: 'var(--accent-orange)',
              fontFamily: 'inherit',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}>
              <span>⚠️ WARNING: Commands are copied to clipboard only.</span>
              <span style={{ opacity: 0.8 }}>Always verify before executing in terminal.</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                style={styles.actionBtn(copied === 'start' ? 'var(--text-primary)' : 'var(--accent-green)')} 
                onClick={() => copyToClipboard(formData.cmd_start, 'start')}
              >
                {copied === 'start' ? '[ COPIED! ]' : `[ START (${formData.cmd_start}) ]`}
              </button>
              <button 
                style={styles.actionBtn(copied === 'stop' ? 'var(--text-primary)' : 'var(--error)')} 
                onClick={() => copyToClipboard(formData.cmd_stop, 'stop')}
              >
                {copied === 'stop' ? '[ COPIED! ]' : `[ STOP (${formData.cmd_stop}) ]`}
              </button>
            </div>
            
            {/* Auto-save indicator + manual save fallback */}
            <button
              style={{
                ...styles.saveBtn,
                backgroundColor:
                  autoSaveStatus === 'saving' ? 'rgba(0,255,170,0.1)' :
                  autoSaveStatus === 'saved'  ? 'var(--accent-green)' :
                  autoSaveStatus === 'error'  ? 'var(--error)' :
                  'var(--accent-blue)',
                color: autoSaveStatus === 'saved' ? 'var(--bg-primary)' : autoSaveStatus === 'saving' ? 'var(--accent-green)' : 'var(--bg-primary)',
                transition: 'background 0.3s, color 0.3s',
              }}
              onClick={handleSave}
            >
              {autoSaveStatus === 'saving' ? '[ AUTO_SAVING... ]' :
               autoSaveStatus === 'saved'  ? '[ ✓ SAVED ]' :
               autoSaveStatus === 'error'  ? '[ SAVE FAILED — RETRY ]' :
               '[ SAVE NOW ]'}
            </button>

            {!showConfirmDelete ? (
              <button 
                style={styles.deleteBtn} 
                onClick={() => setShowConfirmDelete(true)}
              >
                [ DELETE PROJECT ]
              </button>
            ) : (
              <div style={{ marginTop: '1rem', border: '1px solid var(--error)', padding: '1rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '1rem' }}>CONFIRM_DELETION? THIS_ACTION_IS_PERMANENT.</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    style={{ ...styles.actionBtn('var(--error)'), flex: 2 }} 
                    onClick={handleDelete}
                  >
                    [ YES, DELETE ]
                  </button>
                  <button 
                    style={{ ...styles.actionBtn('var(--bg-secondary)'), color: 'var(--text-primary)', flex: 1, border: '1px solid var(--border)' }} 
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    [ CANCEL ]
                  </button>
                </div>
              </div>
            )}

            <div style={{ 
              marginTop: '1.5rem', 
              backgroundColor: 'var(--bg-secondary)', 
              padding: '1.2rem', 
              border: '1px solid var(--border)', 
              borderRadius: '4px',
              boxShadow: 'inset 0 0 10px var(--shadow)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-green)' }}>$</span> {data.name.toLowerCase()} --help
              </div>
              <pre style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: '0.75rem', 
                whiteSpace: 'pre', 
                lineHeight: '1.6',
                fontFamily: 'inherit'
              }}>
            <span style={{ color: 'var(--accent-green)' }}>Available commands:</span>
              {formData.cmd_start.padEnd(22)} <span style={{ color: 'var(--text-muted)' }}>Start project</span>
              {formData.cmd_stop.padEnd(22)} <span style={{ color: 'var(--text-muted)' }}>Stop project</span>
              {"make build".padEnd(22)} <span style={{ color: 'var(--text-muted)' }}>Build for production</span>
              {"make logs".padEnd(22)} <span style={{ color: 'var(--text-muted)' }}>View application logs</span>

            <span style={{ color: 'var(--accent-green)' }}>Project Info:</span>
              Stack:   <span style={{ color: 'var(--text-primary)' }}>{data.stack}</span>
              Status:  <span style={{ color: 'var(--text-primary)' }}>{formData.status.toUpperCase()}</span>
              Updated: <span style={{ color: 'var(--text-primary)' }}>{new Date(data.updated || Date.now()).toLocaleString()}</span>
              <span style={{ display: 'inline-block', width: '8px', height: '14px', backgroundColor: 'var(--accent-green)', verticalAlign: 'middle', marginLeft: '5px', animation: 'blink 1s step-end infinite' }}></span>
              </pre>
              
              <style>{`
                @keyframes blink { 50% { opacity: 0; } }
              `}</style>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '1rem' }}>
              LAST_UPDATE: {data.updated ? new Date(data.updated).toLocaleString() : 'N/A'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
