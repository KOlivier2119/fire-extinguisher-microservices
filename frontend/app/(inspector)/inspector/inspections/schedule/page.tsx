'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectorScheduleInspectionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inspector/inspections');
  }, [router]);

  return null;
}
