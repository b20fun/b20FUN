'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'loading' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  link?: string;
  linkText?: string;
}

interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number, link?: string, linkText?: string) => void;
  showSuccess: (message: string, link?: string) => void;
  showError: (message: string) => void;
  showLoading: (message: string) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000, link?: string, linkText?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, link, linkText }]);
    if (type !== 'loading') {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  const showSuccess = useCallback((message: string, link?: string) => showToast(message, 'success', 4000, link, 'Basescan\'da Gör'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error', 6000), [showToast]);
  const showLoading = useCallback((message: string) => showToast(message, 'loading', 999999), [showToast]);

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    loading: '⏳',
    info: 'ℹ️',
  };

  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D' },
    error: { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626' },
    loading: { bg: 'var(--ice-pale)', border: 'var(--ice-primary)', text: 'var(--ice-deep)' },
    info: { bg: 'var(--ice-pale)', border: 'var(--border)', text: 'var(--text-primary)' },
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showLoading, dismissToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-start gap-3 rounded-xl p-4 shadow-lg"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
            >
              <span className="text-lg flex-shrink-0">{icons[toast.type]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: c.text }}>{toast.message}</p>
                {toast.link && (
                  <a 
                    href={toast.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold underline hover:opacity-80"
                    style={{ color: c.text }}
                  >
                    {toast.linkText || 'View Transaction'} →
                  </a>
                )}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 text-lg leading-none opacity-60 hover:opacity-100" style={{ color: c.text }}>×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
