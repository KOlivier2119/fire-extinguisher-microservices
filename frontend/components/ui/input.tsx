import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50 outline-none',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
