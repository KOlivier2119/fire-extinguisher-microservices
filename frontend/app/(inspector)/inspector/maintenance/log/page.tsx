import LogMaintenanceForm from '@/components/features/LogMaintenanceForm';
import PermissionGuard from '@/components/PermissionGuard';
import { canLogMaintenance, portalPath } from '@/lib/rbac';

export default function InspectorLogMaintenancePage() {
  return (
    <PermissionGuard allowed={canLogMaintenance('INSPECTOR')} redirectTo={portalPath('INSPECTOR', '/maintenance')}>
      <LogMaintenanceForm role="INSPECTOR" />
    </PermissionGuard>
  );
}
