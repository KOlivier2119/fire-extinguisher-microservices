'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectorExtinguisherEditPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inspector/extinguishers');
  }, [router]);

  return null;
}
