import { useCallback } from 'react';
import db from '../lib/db';

export function useProjectDragDrop(showToast) {
  const handleDragStart = useCallback((e, id) => {
    e.dataTransfer.setData('text/plain', id);
    // Optional: Add ghosting or styling classes here
  }, []);

  const handleDrop = useCallback(async (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    
    // Safety check for invalid drop data
    if (!id || id === 'drag') return;

    try {
      // Use server-side time::now() for consistency
      await db.query('UPDATE type::thing($id) SET status = $status, updated = time::now()', { id, status });
      showToast('Project moved successfully', 'success');
    } catch (err) {
      console.error('[DragDrop] Move failed:', err);
      showToast('Move failed', 'error');
    }
  }, [showToast]);

  return { handleDragStart, handleDrop };
}
