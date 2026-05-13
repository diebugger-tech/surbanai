import React, { useState, useEffect } from 'react';
import db from '../lib/db';

export default function CreateProjectModal({ isOpen, onClose, onNotify, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🚀',
    stack: 'SvelteKit 5, SurrealDB',
    desc: '',
    status: 'backlog',
    cmd_start: 'npm run dev',
    cmd_stop: 'CTRL+C'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return onNotify('Project name is required', 'error');

    setLoading(true);
    try {
      const [res] = await db.query('CREATE projekt CONTENT $data', { 
        data: {
          ...formData,
          tags: [],
          erstellt: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      });
      const newProj = res.result?.[0] || res[0];
      onNotify('Project created successfully');
      if (onCreate) onCreate(newProj);
      onClose();
      // Reset form
      setFormData({
        name: '',
        icon: '🚀',
        stack: 'React',
        status: 'todo'
      });
    } catch (err) {
      console.error('Create failed:', err);
      onNotify(`Creation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-overlay)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
    },
    container: {
      width: '100%', maxWidth: '500px',
      backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
      boxShadow: '0 0 40px rgba(0, 255, 170, 0.1)', display: 'flex', flexDirection: 'column',
      position: 'relative', padding: '2rem'
    },
    closeBtn: {
      position: 'absolute', top: '1rem', right: '1rem',
      background: 'transparent', border: 'none', color: 'var(--error)',
      fontSize: '1rem', cursor: 'pointer', fontFamily: 'monospace'
    },
    form: {
      display: 'flex', flexDirection: 'column', gap: '1.2rem'
    },
    label: {
      color: 'var(--accent-green)', fontSize: '0.75rem', marginBottom: '0.3rem', display: 'block'
    },
    input: {
      width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
      border: '1px solid var(--border)', padding: '0.6rem', fontFamily: 'inherit',
      fontSize: '0.9rem', outline: 'none'
    },
    submitBtn: {
      marginTop: '1rem', backgroundColor: 'var(--accent-green)', color: 'var(--bg-primary)',
      border: 'none', padding: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
      fontFamily: 'inherit', letterSpacing: '1px'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.container}>
        <button onClick={onClose} style={styles.closeBtn}>[ ESC_CANCEL ]</button>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-green)', fontSize: '1.2rem' }}>&gt; INITIALIZE_NEW_PROJECT</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.4rem' }}>System ready for project definition...</div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label}>PROJEKT_NAME</label>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. CabellistPro"
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              style={styles.input} 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '80px' }}>
              <label style={styles.label}>ICON</label>
              <input 
                type="text" 
                value={formData.icon} 
                onChange={e => setFormData({ ...formData, icon: e.target.value })} 
                style={{ ...styles.input, textAlign: 'center' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>TECH_STACK</label>
              <input 
                type="text" 
                placeholder="e.g. FastAPI, Rust"
                value={formData.stack} 
                onChange={e => setFormData({ ...formData, stack: e.target.value })} 
                style={styles.input} 
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>DESCRIPTION</label>
            <textarea 
              value={formData.desc} 
              onChange={e => setFormData({ ...formData, desc: e.target.value })} 
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} 
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '[ INITIALIZING... ]' : '[ EXECUTE_CREATE ]'}
          </button>
        </form>
      </div>
    </div>
  );
}
