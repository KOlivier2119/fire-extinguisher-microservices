import ScheduleInspectionForm from '@/components/features/ScheduleInspectionForm';
import PermissionGuard from '@/components/PermissionGuard';
import { canScheduleInspection, portalPath } from '@/lib/rbac';

export default function UserSchedulePage() {
  return (
    <PermissionGuard allowed={canScheduleInspection('USER')} redirectTo={portalPath('USER', '/dashboard')}>
      <ScheduleInspectionForm role="USER" />
    </PermissionGuard>
  );
}
