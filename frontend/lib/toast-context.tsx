'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
