'use client';

import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/lib/toast-context';
import { cn } from '@/lib/utils';

const VARIANT_STYLES = {
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
};

const VARIANT_ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
};

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:max-w-sm">
      {toasts.map((item) => {
        const Icon = VARIANT_ICONS[item.variant];
        return (
          <div
            key={item.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2',
              VARIANT_STYLES[item.variant],
            )}
          >
            <Icon className="size-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm leading-relaxed">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
