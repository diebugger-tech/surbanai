import React, { useState, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';

/**
 * Board — owns the global dropTarget state.
 * Keeping dropTarget here (not in KanbanColumn) allows cross-column
 * ghost indicators in v1.5 (Reorder Columns / move between columns).
 */
export default function Board({
  columns,
  projects,
  isLoading,
  onDragStart,
  onDrop,
  onCardClick,
  wikiStats,
}) {
  const [dropTarget, setDropTarget] = useState(null);
  // dropTarget shape: { spalte: 'in-progress', index: 2 } | null

  /**
   * getInsertIndex — given a column id and the cursor's clientY position,
   * returns the index at which the ghost card should appear.
   * Uses data-card attributes set on every KanbanCard root element.
   */
  const getInsertIndex = useCallback((spalteId, clientY) => {
    const cardEls = document.querySelectorAll(
      `[data-spalte="${spalteId}"] [data-card]`
    );
    let index = cardEls.length;
    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        index = i;
        break;
      }
    }
    return index;
  }, []);

  const handleDrop = (e, columnId) => {
    setDropTarget(null);
    onDrop(e, columnId);
  };

  return (
    <main style={styles.board}>
      {columns.map(col => (
        <KanbanColumn
          key={col.id}
          column={col}
          projects={projects.filter(p => p.status === col.id)}
          allProjects={projects}
          isLoading={isLoading}
          onDragStart={onDragStart}
          onDragOver={(e, spalteId, clientY) => {
            e.preventDefault();
            const index = getInsertIndex(spalteId, clientY);
            setDropTarget({ spalte: spalteId, index });
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={handleDrop}
          onDragEnd={() => setDropTarget(null)}
          onCardClick={onCardClick}
          wikiStats={wikiStats}
          dropTarget={dropTarget}
        />
      ))}
    </main>
  );
}

const styles = {
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
  },
};
