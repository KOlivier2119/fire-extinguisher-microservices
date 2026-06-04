'use client';

import { useEffect, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { api, User, UserRole } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { RoleBadge } from '@/lib/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import UserDetailsDialog from '@/components/features/UserDetailsDialog';

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<{ data: User[] }>('/users')
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const { page, setPage, totalPages, paginatedItems, totalItems, pageSize } = usePagination(users, 8);

  const updateRole = async (id: string, role: UserRole) => {
    const user = users.find((u) => u.id === id);
    if (!user || user.role === role) return;
    try {
      const res = await api<{ data: User }>(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      toast(`${user.firstName} ${user.lastName} is now ${role.toLowerCase()}.`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update role', 'error');
    }
  };

  const handleRoleUpdated = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    toast(`${updated.firstName} ${updated.lastName} is now ${updated.role.toLowerCase()}.`, 'success');
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await api(`/users/${deleteUser.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      toast(`${deleteUser.firstName} ${deleteUser.lastName} was deleted.`, 'success');
      if (viewUserId === deleteUser.id) setViewUserId(null);
      setDeleteUser(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View accounts, assign roles, and remove users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
          <CardDescription>{users.length} registered users in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.firstName} {u.lastName}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                            className="max-w-[140px]"
                            disabled={isSelf}
                          >
                            <option value="USER">USER</option>
                            <option value="INSPECTOR">INSPECTOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewUserId(u.id)}
                              aria-label={`View ${u.firstName} ${u.lastName}`}
                            >
                              <Eye className="size-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isSelf}
                              onClick={() => setDeleteUser(u)}
                              aria-label={`Delete ${u.firstName} ${u.lastName}`}
                            >
                              <Trash2 className="size-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <UserDetailsDialog
        userId={viewUserId}
        currentUserId={currentUser?.id}
        onClose={() => setViewUserId(null)}
        onRoleUpdated={handleRoleUpdated}
      />

      <ConfirmDialog
        open={!!deleteUser}
        title="Delete user?"
        description={
          deleteUser
            ? `This will permanently remove ${deleteUser.firstName} ${deleteUser.lastName} (${deleteUser.email}). They will no longer be able to sign in.`
            : ''
        }
        confirmLabel="Delete user"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}
