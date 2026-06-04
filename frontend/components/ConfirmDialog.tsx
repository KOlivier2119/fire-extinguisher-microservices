'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  alertOnly?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  destructive = false,
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!alertOnly && (
            <Button variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={destructive && !alertOnly ? 'destructive' : 'default'}
            className={cn(
              'w-full sm:w-auto',
              destructive && !alertOnly && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
            onClick={alertOnly ? onCancel : onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait...' : alertOnly ? (confirmLabel || 'OK') : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
