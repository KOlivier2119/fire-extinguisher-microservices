import ReportsPanel from '@/components/features/ReportsPanel';
import PermissionGuard from '@/components/PermissionGuard';
import { canViewReports, portalPath } from '@/lib/rbac';

export default function AdminReportsPage() {
  return (
    <PermissionGuard allowed={canViewReports('ADMIN')} redirectTo={portalPath('ADMIN', '/dashboard')}>
      <ReportsPanel role="ADMIN" />
    </PermissionGuard>
  );
}
