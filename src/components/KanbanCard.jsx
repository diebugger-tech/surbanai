// KAiOSS — KanbanCard
// Mit data-card Attribut für Ghost Calculation v1.4

import React, { useState, useEffect } from 'react';
import db from '../lib/db';

export default function KanbanCard({ project, onDragStart, onDragEnd, onClick }) {
  const [progress, setProgress] = useState(0);

  const loadProgress = async (projektName) => {
    if (!projektName) return 0;
    try {
      const result = await db.query(
        `SELECT
          count() as total,
          count(status = 'done' OR status = 'erledigt') as done
        FROM wiki
        WHERE projekt = $name AND typ = 'todo'`,
        { name: projektName }
      );
      const data = result[0]?.[0] || { total: 0, done: 0 };
      return data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
    } catch (err) {
      console.warn('[Pulse] Error loading progress:', err);
      return 0;
    }
  };

  useEffect(() => {
    let liveId = null;
    let isMounted = true;

    const startLive = async () => {
      if (!project?.name) return;
      try {
        const id = await db.live('wiki', ({ action, result }) => {
          if (!isMounted) return;
          if (result.projekt === project.name && result.typ === 'todo') {
            loadProgress(project.name).then(setProgress);
          }
        });
        
        if (isMounted) {
          liveId = id;
        } else if (id && db.kill) {
          db.kill(id).catch(() => {});
        }
      } catch (err) {
        console.warn('[Pulse] Live subscription failed:', err);
      }
    };

    if (project?.name) {
      loadProgress(project.name).then(setProgress);
      startLive();
    }

    return () => {
      isMounted = false;
      if (liveId && db.kill) {
        db.kill(liveId).catch(() => {});
      }
    };
  }, [project?.name]);

  const styles = {
    card: {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '1rem',
      marginBottom: '1rem',
      cursor: 'grab',
      transition: 'all 0.2s ease',
      borderLeft: '4px solid var(--accent-green)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      marginBottom: '0.5rem'
    },
    icon: { fontSize: '1.2rem' },
    cardTitle: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: 'var(--accent-green)',
      margin: 0
    },
    stack: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      marginBottom: '0.8rem',
      fontStyle: 'italic'
    },
    desc: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      lineHeight: '1.4',
      marginBottom: '1rem'
    },
    pulseContainer: {
      marginTop: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    },
    pulseText: {
      fontSize: '0.65rem',
      color: '#1D9E75',
      fontFamily: 'monospace',
      display: 'flex',
      justifyContent: 'space-between',
      opacity: 0.8
    },
    pulseBar: {
      height: '4px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '2px',
      overflow: 'hidden'
    },
    pulseFill: {
      height: '100%',
      width: progress + '%',
      background: progress === 100 ? '#1D9E75' :
                  progress > 50  ? '#EF9F27' : '#378ADD',
      transition: 'width 0.5s ease',
      boxShadow: `0 0 10px ${progress === 100 ? 'rgba(29, 158, 117, 0.4)' : 'transparent'}`
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.4rem',
      marginTop: '0.8rem'
    },
    tag: {
      fontSize: '0.65rem',
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--accent-green)',
      padding: '2px 6px',
      borderRadius: '2px',
      border: '1px solid var(--border)'
    },
  };

  return (
    <div
      data-card={project.id}
      style={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, project.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(project.id)}
    >
      <div style={styles.cardHeader}>
        <span style={styles.icon}>{project.icon || '📦'}</span>
        <h3 style={styles.cardTitle}>{project.name}</h3>
      </div>
      <div style={styles.stack}>{project.stack}</div>
      <div style={styles.desc}>{project.desc}</div>
      
      <div style={styles.pulseContainer}>
        <div style={styles.pulseText}>
          <span>{'> PROJECT_PULSE'}</span>
          <span>{progress + '%'}</span>
        </div>
        <div style={styles.pulseBar}>
          <div style={styles.pulseFill} />
        </div>
      </div>

      <div style={styles.tagsContainer}>
        {Array.isArray(project.tags) && project.tags.map((tag, idx) => (
          <span key={idx} style={styles.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
