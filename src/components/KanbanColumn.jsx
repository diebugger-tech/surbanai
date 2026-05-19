// KAiOSS — KanbanColumn
// Enthält den Ghost Drop Indicator v1.4

import React from 'react';
import KanbanCard from './KanbanCard';
import BacklogDashboard from './BacklogDashboard';

const ghostStyle = {
  height: '80px',
  border: '1.5px dashed var(--accent-green)',
  borderRadius: '8px',
  background: 'rgba(29,158,117,0.06)',
  margin: '4px 0',
  transition: 'all 0.15s ease',
  pointerEvents: 'none',
};

export default function KanbanColumn({
  column,
  projects,
  allProjects,
  isLoading,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCardClick,
  wikiStats,
  dropTarget,
  dbReady = false,
}) {
  const isOver = dropTarget?.spalte === column.id;

  const styles = {
    column: {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '1rem',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isOver ? `0 0 15px ${column.color}` : 'none',
      borderColor: isOver ? column.color : 'var(--border)',
    },
    columnHeader: {
      color: column.color,
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    count: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      backgroundColor: 'var(--bg-primary)',
      padding: '2px 6px',
      borderRadius: '10px',
      border: '1px solid var(--border)',
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px dashed var(--border)',
      borderRadius: '4px',
      color: 'var(--text-muted)',
      fontSize: '0.75rem',
      userSelect: 'none',
    },
  };

  return (
    <div
      data-spalte={column.id}
      style={styles.column}
      onDragOver={(e) => onDragOver(e, column.id, e.clientY)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div style={styles.columnHeader}>
        <span>⬤</span> {column.title}
        <span style={styles.count}>{isLoading ? '...' : projects.length}</span>
      </div>

      {isLoading ? (
        <>
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </>
      ) : (
        <>
          {projects.map((project, i) => (
            <React.Fragment key={project.id.toString()}>
              {/* Ghost indicator BEFORE this card */}
              {dropTarget?.spalte === column.id && dropTarget?.index === i && (
                <div style={ghostStyle} aria-hidden="true" />
              )}
              <KanbanCard
                project={project}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onCardClick}
                wikiStats={wikiStats}
                dbReady={dbReady}
              />
            </React.Fragment>
          ))}

          {/* Ghost at end of list (or in empty column) */}
          {dropTarget?.spalte === column.id &&
            dropTarget?.index === projects.length && (
              <div style={ghostStyle} aria-hidden="true" />
            )}

          {/* Empty state — shown only when no ghost is active */}
          {projects.length === 0 && !isOver && (
            column.id === 'backlog' ? (
              <BacklogDashboard allProjects={allProjects || []} wikiStats={wikiStats || {}} />
            ) : (
              <div style={styles.emptyState}>&gt; NO TASKS</div>
            )
          )}
        </>
      )}
    </div>
  );
}
