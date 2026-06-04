'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectorReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inspector/dashboard');
  }, [router]);

  return null;
}
