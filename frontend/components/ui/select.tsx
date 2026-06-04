import { cn } from '@/lib/utils';

function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
