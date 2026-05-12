import React from 'react';

export default function BacklogDashboard({ allProjects = [], wikiStats = {} }) {
  const totalProjects = allProjects.length;
  const totalTasks = Object.values(wikiStats).reduce((acc, stats) => acc + (stats.total || 0), 0);
  const totalDone = Object.values(wikiStats).reduce((acc, stats) => acc + (stats.done || 0), 0);
  
  const avgProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.label}>[ SYSTEM_MONITOR ]</div>
        <div style={{ ...styles.value, color: 'var(--accent-green)' }}>● ONLINE</div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.label}>GLOBAL_PULSE</div>
        <div style={styles.pulseBar}>
          <div style={{ ...styles.pulseFill, width: `${avgProgress}%` }} />
        </div>
        <div style={styles.subtext}>{avgProgress}% COMPLETION</div>
      </div>

      <div style={styles.grid}>
        <div style={styles.gridItem}>
          <div style={styles.statVal}>{totalProjects}</div>
          <div style={styles.statLabel}>PROJEKTE</div>
        </div>
        <div style={styles.gridItem}>
          <div style={styles.statVal}>{totalTasks}</div>
          <div style={styles.statLabel}>AUFGABEN</div>
        </div>
        <div style={styles.gridItem}>
          <div style={{ ...styles.statVal, color: 'var(--accent-green)' }}>{totalDone}</div>
          <div style={styles.statLabel}>ERLEDIGT</div>
        </div>
        <div style={styles.gridItem}>
          <div style={{ ...styles.statVal, color: totalTasks - totalDone > 0 ? 'var(--accent-orange, #ffaa00)' : 'var(--text-muted)' }}>
            {totalTasks - totalDone}
          </div>
          <div style={styles.statLabel}>OFFEN</div>
        </div>
      </div>

      <div style={styles.tip}>
        <span style={{ color: 'var(--accent-blue)' }}>TIP:</span> [T] Todo-Panel // [?] Wiki // [Ctrl+K] Search
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '0.5rem',
    fontFamily: 'monospace',
    color: 'var(--text-primary)'
  },
  section: {
    marginBottom: '1.5rem'
  },
  label: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: '0.3rem'
  },
  value: {
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  pulseBar: {
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '0.5rem'
  },
  pulseFill: {
    height: '100%',
    backgroundColor: 'var(--accent-green)',
    boxShadow: '0 0 10px var(--accent-green)',
    transition: 'width 1s ease-in-out'
  },
  subtext: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginTop: '0.4rem',
    textAlign: 'right'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.8rem',
    marginBottom: '1.5rem'
  },
  gridItem: {
    padding: '0.8rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    textAlign: 'center'
  },
  statVal: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--accent-blue)'
  },
  statLabel: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    marginTop: '0.2rem'
  },
  manifest: {
    padding: '1rem',
    backgroundColor: 'var(--bg-primary)',
    borderLeft: '2px solid var(--accent-blue)',
    marginBottom: '1.5rem'
  },
  logLine: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    margin: '2px 0'
  },
  tip: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    padding: '0.5rem',
    border: '1px dashed var(--border)',
    borderRadius: '4px'
  }
};
