import { useEffect } from 'react';

export function useKeyboardNavigation({
  setShowWiki,
  setShowTodo,
  setShowCreateModal,
  setSelectedProjectId,
  setShowCommandPalette,
  setShowKaiPanel,
  logEvent
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      
      if (e.key === '?') {
        setShowWiki(prev => !prev);
        logEvent('view', 'wiki', null, 'Wiki toggled via keyboard');
      }
      
      if (e.key === 't' || e.key === 'T') {
        setShowTodo(prev => !prev);
        logEvent('view', 'todo', null, 'Todo panel toggled via keyboard');
      }
      
      if (e.key === 'Escape') {
        setShowWiki(false);
        setShowTodo(false);
        setShowCreateModal(false);
        setSelectedProjectId(null);
        setShowCommandPalette(false);
        setShowKaiPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowWiki, setShowTodo, setShowCreateModal, setSelectedProjectId, setShowCommandPalette, setShowKaiPanel, logEvent]);
}
