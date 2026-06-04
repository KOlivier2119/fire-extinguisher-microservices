'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PORTAL_HOME } from '@/lib/rbac';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace(PORTAL_HOME[user.role]);
    }
  }, [user, loading, router]);

  return null;
}
