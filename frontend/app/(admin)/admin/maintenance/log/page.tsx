'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMaintenanceLogPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/maintenance');
  }, [router]);

  return null;
}
