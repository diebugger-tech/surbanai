import React, { createContext, useContext, useCallback } from 'react';

const LogContext = createContext();

/**
 * Context Provider for the global terminal/event logging system.
 * Replaces ad-hoc window events with a structured React Context.
 */
export function LogProvider({ children }) {
  
  /**
   * Global logger function.
   * Dispatches a custom event that TerminalLog listens to.
   */
  const logEvent = useCallback((action, table, result, message) => {
    window.dispatchEvent(new CustomEvent('surreal-log', {
      detail: { 
        action, 
        table, 
        result, 
        message,
        timestamp: new Date().toISOString()
      }
    }));
  }, []);

  return (
    <LogContext.Provider value={{ logEvent }}>
      {children}
    </LogContext.Provider>
  );
}

/**
 * Hook to access the global logger
 */
export function useLog() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
}
