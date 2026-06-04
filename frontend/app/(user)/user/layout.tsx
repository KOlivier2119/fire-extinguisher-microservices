import RoleGuard from '@/components/RoleGuard';

export default function UserPortalLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['USER']}>{children}</RoleGuard>;
}
