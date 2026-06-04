'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PermissionGuardProps {
  allowed: boolean;
  redirectTo: string;
  children: React.ReactNode;
}

export default function PermissionGuard({ allowed, redirectTo, children }: PermissionGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!allowed) router.replace(redirectTo);
  }, [allowed, redirectTo, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
