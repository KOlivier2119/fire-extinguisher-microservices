import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full bg-sidebar-accent', className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex size-full items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
