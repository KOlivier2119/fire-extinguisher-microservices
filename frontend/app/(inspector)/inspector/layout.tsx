import RoleGuard from '@/components/RoleGuard';

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['INSPECTOR']}>{children}</RoleGuard>;
}
