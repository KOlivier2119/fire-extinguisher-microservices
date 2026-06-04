'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

interface FormFieldProps extends Omit<ComponentProps<typeof Input>, 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <div id={`${id}-error`} className="space-y-1" role="alert">
      {error.split('\n').map((line, index) => (
        <p key={`${id}-error-${index}`} className="text-sm text-destructive">
          {error.includes('\n') ? `• ${line}` : line}
        </p>
      ))}
    </div>
  );
}

export default function FormField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(error && 'border-destructive focus-visible:ring-destructive/30', className)}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError id={id} error={error} />
    </div>
  );
}
