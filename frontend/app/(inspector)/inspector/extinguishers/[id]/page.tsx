'use client';

import { useParams } from 'next/navigation';
import ExtinguisherDetail from '@/components/features/ExtinguisherDetail';

export default function InspectorExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ExtinguisherDetail role="INSPECTOR" id={id} />;
}
