'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { legacyRedirect, PORTAL_HOME } from '@/lib/rbac';

export default function LegacyRedirect() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const target = legacyRedirect(user.role, pathname) ?? PORTAL_HOME[user.role];
    router.replace(target);
  }, [user, loading, pathname, router]);

  return null;
}
