'use client';

import { useParams } from 'next/navigation';
import ExtinguisherForm from '@/components/features/ExtinguisherForm';
import PermissionGuard from '@/components/PermissionGuard';
import { canEditExtinguisher, portalPath } from '@/lib/rbac';

export default function AdminEditExtinguisherPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PermissionGuard allowed={canEditExtinguisher('ADMIN')} redirectTo={portalPath('ADMIN', '/extinguishers')}>
      <ExtinguisherForm role="ADMIN" id={id} />
    </PermissionGuard>
  );
}
