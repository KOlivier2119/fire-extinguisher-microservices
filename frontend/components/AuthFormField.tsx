import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
}

export default function AuthFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required,
  minLength,
  maxLength,
  error,
  autoComplete,
  inputMode,
  placeholder,
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(error && 'border-destructive focus-visible:ring-destructive/30')}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <div id={`${id}-error`} className="space-y-1" role="alert">
          {error.split('\n').map((line, index) => (
            <p key={`${id}-error-${index}`} className="text-sm text-destructive">
              {error.includes('\n') ? `• ${line}` : line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
