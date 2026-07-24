/**
 * Toast notification system.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

/**
 * Hook to show toasts from any component.
 * @returns {(msg: string, type?: string) => void}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/**
 * Provider wrapping the app.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
