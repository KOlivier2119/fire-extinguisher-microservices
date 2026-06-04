'use client';

import { useParams } from 'next/navigation';
import ExtinguisherDetail from '@/components/features/ExtinguisherDetail';

export default function AdminExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ExtinguisherDetail role="ADMIN" id={id} />;
}
