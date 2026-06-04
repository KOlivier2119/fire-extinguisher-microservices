'use client';

import ExtinguisherForm from '@/components/features/ExtinguisherForm';
import PermissionGuard from '@/components/PermissionGuard';
import { canCreateExtinguisher, portalPath } from '@/lib/rbac';

export default function AdminNewExtinguisherPage() {
  return (
    <PermissionGuard allowed={canCreateExtinguisher('ADMIN')} redirectTo={portalPath('ADMIN', '/extinguishers')}>
      <ExtinguisherForm role="ADMIN" />
    </PermissionGuard>
  );
}
