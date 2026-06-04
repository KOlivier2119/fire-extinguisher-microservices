'use client';

import { useParams } from 'next/navigation';
import ExtinguisherDetail from '@/components/features/ExtinguisherDetail';

export default function UserExtinguisherDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ExtinguisherDetail role="USER" id={id} />;
}
