'use client';

import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Mail, Pencil, Shield, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError, fieldErrorsToRecord } from '@/lib/api';
import { api } from '@/lib/api';
import {
  changePasswordSchema,
  createUpdateProfileSchema,
  resetPasswordSchema,
  verifyResetOtpSchema,
} from '@/lib/auth-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RoleBadge } from '@/lib/status-badges';
import { useToast } from '@/lib/toast-context';

type ActivePanel = null | 'profile' | 'password' | 'reset-password';
type ResetStep = 'request' | 'verify' | 'new-password';

const RESEND_COOLDOWN_SEC = 60;

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return '—';
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileForm() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [resetStep, setResetStep] = useState<ResetStep>('request');
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currentPassword: '',
    });
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const emailChanging = useMemo(
    () => Boolean(user && profile.email.trim().toLowerCase() !== user.email.toLowerCase()),
    [user, profile.email],
  );

  const profileSchema = useMemo(
    () => (user ? createUpdateProfileSchema(user.email) : null),
    [user],
  );

  const initials = user
    ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase()
    : '?';

  const resetProfileForm = () => {
    if (!user) return;
    setProfile({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currentPassword: '',
    });
    setProfileErrors({});
    setProfileError('');
    setProfileMessage('');
  };

  const resetPasswordForm = () => {
    setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setPasswordErrors({});
    setPasswordError('');
    setPasswordMessage('');
  };

  const resetOtpFlow = () => {
    setResetStep('request');
    setOtp('');
    setResetSessionToken('');
    setNewResetPassword('');
    setResetErrors({});
    setResetError('');
    setResetMessage('');
    setResendCooldown(0);
  };

  const closePanel = () => {
    setActivePanel(null);
    resetProfileForm();
    resetPasswordForm();
    resetOtpFlow();
  };

  const openProfileEdit = () => {
    resetProfileForm();
    setActivePanel('profile');
  };

  const openPasswordEdit = () => {
    resetPasswordForm();
    resetOtpFlow();
    setActivePanel('password');
  };

  const openResetPassword = () => {
    resetPasswordForm();
    resetOtpFlow();
    setActivePanel('reset-password');
  };

  const clearProfileError = (field: string) => {
    setProfileErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearPasswordError = (field: string) => {
    setPasswordErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearResetError = (field: string) => {
    setResetErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileSchema) return;

    setProfileMessage('');
    setProfileError('');
    setProfileErrors({});

    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      setProfileErrors(zodFieldErrors(parsed.error));
      return;
    }

    setSavingProfile(true);
    try {
      await api('/users/profile', { method: 'PUT', body: JSON.stringify(parsed.data) });
      setProfileMessage('Profile updated successfully');
      toast('Profile updated successfully.', 'success');
      setProfile((prev) => ({ ...prev, currentPassword: '' }));
      await refreshUser();
      setTimeout(() => {
        setActivePanel(null);
        setProfileMessage('');
      }, 1500);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Failed to update profile';
      if (err instanceof ApiError) {
        const mapped = fieldErrorsToRecord(err.fieldErrors);
        if (Object.keys(mapped).length > 0) setProfileErrors(mapped);
      }
      setProfileError(message);
      toast(message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    setPasswordErrors({});

    const parsed = changePasswordSchema.safeParse(passwords);
    if (!parsed.success) {
      setPasswordErrors(zodFieldErrors(parsed.error));
      return;
    }

    setChangingPassword(true);
    try {
      await api('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
        }),
      });
      setPasswordMessage('Password changed successfully. Signing you out...');
      toast('Password changed successfully. Signing you out...', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setTimeout(() => logout(), 2000);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Failed to change password';
      if (err instanceof ApiError) {
        const mapped = fieldErrorsToRecord(err.fieldErrors);
        if (Object.keys(mapped).length > 0) setPasswordErrors(mapped);
      }
      setPasswordError(message);
      toast(message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const sendResetCode = async () => {
    if (!user) return;
    setResetError('');
    setResetMessage('');
    setResetLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: user.email }),
      });
      setResetMessage(`A verification code was sent to ${user.email}`);
      toast(`Verification code sent to ${user.email}.`, 'success');
      setResetStep('verify');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      setResetError(message);
      toast(message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const resendResetCode = async () => {
    if (!user || resendCooldown > 0) return;
    await sendResetCode();
  };

  const verifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setResetError('');
    setResetErrors({});
    setResetMessage('');

    const parsed = verifyResetOtpSchema.safeParse({ email: user.email, otp });
    if (!parsed.success) {
      setResetErrors(zodFieldErrors(parsed.error));
      return;
    }

    setResetLoading(true);
    try {
      const res = await api<{ success: boolean; data: { resetSessionToken: string } }>(
        '/auth/verify-reset-otp',
        { method: 'POST', body: JSON.stringify(parsed.data) },
      );
      setResetSessionToken(res.data.resetSessionToken);
      setResetStep('new-password');
      setResetMessage('');
      toast('Code verified. Choose your new password.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setResetError(message);
      toast(message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const submitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetErrors({});

    const parsed = resetPasswordSchema.safeParse({
      resetSessionToken,
      newPassword: newResetPassword,
    });
    if (!parsed.success) {
      setResetErrors(zodFieldErrors(parsed.error));
      return;
    }

    setResetLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setResetMessage('Password reset successfully. Signing you out...');
      toast('Password reset successfully. Signing you out...', 'success');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setResetError(message);
      toast(message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage your account</p>
      </div>

      {/* Profile header — name & email on gradient */}
      <Card className="overflow-hidden py-0 gap-0">
        <div className="bg-gradient-to-r from-primary to-primary/75 px-6 pt-6 pb-8 text-primary-foreground">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="size-16 shrink-0 border-2 border-primary-foreground/30 shadow-lg">
                <AvatarFallback className="text-lg bg-primary-foreground/15 text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold truncate">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-primary-foreground/90 truncate mt-0.5">{user.email}</p>
                <RoleBadge
                  role={user.role}
                  className="mt-2 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground"
                />
              </div>
            </div>
            {activePanel === null && (
              <Button variant="secondary" onClick={openProfileEdit} className="shrink-0">
                <Pencil className="size-4" />
                Update profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Personal information</CardTitle>
            <CardDescription>
              {activePanel === 'profile'
                ? 'Edit your name and email address'
                : 'Your name and contact details'}
            </CardDescription>
          </div>
          {activePanel === 'profile' && (
            <Button variant="ghost" size="sm" onClick={closePanel} aria-label="Cancel editing">
              <X className="size-4" />
              Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activePanel !== 'profile' ? (
            <div className="divide-y">
              <InfoRow label="First name" value={user.firstName} icon={UserIcon} />
              <InfoRow label="Last name" value={user.lastName} icon={UserIcon} />
              <InfoRow label="Email address" value={user.email} icon={Mail} />
              <InfoRow label="Member since" value={formatMemberSince(user.createdAt)} icon={Shield} />
            </div>
          ) : (
            <>
              {profileMessage && (
                <Alert variant="success" className="mb-4">
                  <AlertDescription>{profileMessage}</AlertDescription>
                </Alert>
              )}
              {profileError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={saveProfile} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AuthFormField
                    id="firstName"
                    label="First name"
                    value={profile.firstName}
                    onChange={(v) => { setProfile({ ...profile, firstName: v }); clearProfileError('firstName'); }}
                    maxLength={100}
                    error={profileErrors.firstName}
                  />
                  <AuthFormField
                    id="lastName"
                    label="Last name"
                    value={profile.lastName}
                    onChange={(v) => { setProfile({ ...profile, lastName: v }); clearProfileError('lastName'); }}
                    maxLength={100}
                    error={profileErrors.lastName}
                  />
                </div>
                <AuthFormField
                  id="email"
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(v) => { setProfile({ ...profile, email: v }); clearProfileError('email'); }}
                  maxLength={255}
                  error={profileErrors.email}
                />
                {emailChanging && (
                  <>
                    <AuthFormField
                      id="profileCurrentPassword"
                      label="Current password"
                      type="password"
                      value={profile.currentPassword}
                      onChange={(v) => { setProfile({ ...profile, currentPassword: v }); clearProfileError('currentPassword'); }}
                      autoComplete="current-password"
                      error={profileErrors.currentPassword}
                    />
                    <p className="text-xs text-muted-foreground">
                      Changing your email requires your current password. Both old and new addresses will receive a security notification.
                    </p>
                  </>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closePanel} disabled={savingProfile}>
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription>
              {activePanel === 'password' && 'Change your password using your current one'}
              {activePanel === 'reset-password' && 'Reset your password with a verification code sent to your email'}
              {activePanel === null && 'Password and account security'}
              {activePanel === 'profile' && 'Password and account security'}
            </CardDescription>
          </div>
          {(activePanel === 'password' || activePanel === 'reset-password') && (
            <Button variant="ghost" size="sm" onClick={closePanel} aria-label="Cancel">
              <X className="size-4" />
              Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activePanel === null || activePanel === 'profile' ? (
            <div className="space-y-4">
              <InfoRow label="Password" value="••••••••••••" icon={KeyRound} />
              <p className="text-sm text-muted-foreground">
                Change your password while signed in, or reset it with a verification code sent to your email.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openPasswordEdit} disabled={activePanel === 'profile'}>
                  <KeyRound className="size-4" />
                  Change password
                </Button>
                <Button variant="outline" size="sm" onClick={openResetPassword} disabled={activePanel === 'profile'}>
                  <Mail className="size-4" />
                  Reset with email code
                </Button>
              </div>
            </div>
          ) : activePanel === 'password' ? (
            <>
              {passwordMessage && (
                <Alert variant="success" className="mb-4">
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              )}
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={changePassword} className="space-y-4" noValidate>
                <AuthFormField
                  id="currentPassword"
                  label="Current password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(v) => { setPasswords({ ...passwords, currentPassword: v }); clearPasswordError('currentPassword'); }}
                  autoComplete="current-password"
                  error={passwordErrors.currentPassword}
                />
                <Separator />
                <AuthFormField
                  id="newPassword"
                  label="New password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(v) => { setPasswords({ ...passwords, newPassword: v }); clearPasswordError('newPassword'); }}
                  autoComplete="new-password"
                  maxLength={128}
                  error={passwordErrors.newPassword}
                />
                <AuthFormField
                  id="confirmNewPassword"
                  label="Confirm new password"
                  type="password"
                  value={passwords.confirmNewPassword}
                  onChange={(v) => { setPasswords({ ...passwords, confirmNewPassword: v }); clearPasswordError('confirmNewPassword'); }}
                  autoComplete="new-password"
                  maxLength={128}
                  error={passwordErrors.confirmNewPassword}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Changing...' : 'Update password'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closePanel} disabled={changingPassword}>
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              {resetMessage && (
                <Alert variant="success" className="mb-4">
                  <AlertDescription>{resetMessage}</AlertDescription>
                </Alert>
              )}
              {resetError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              )}

              {resetStep === 'request' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We will send a 6-digit verification code to <strong>{user.email}</strong>.
                    Use it to set a new password without leaving the portal.
                  </p>
                  <Button onClick={sendResetCode} disabled={resetLoading}>
                    {resetLoading ? 'Sending...' : 'Send verification code'}
                  </Button>
                </div>
              )}

              {resetStep === 'verify' && (
                <form onSubmit={verifyResetCode} className="space-y-4" noValidate>
                  <AuthFormField
                    id="resetOtp"
                    label="Verification code"
                    value={otp}
                    onChange={(v) => {
                      setOtp(v.replace(/\D/g, '').slice(0, 6));
                      clearResetError('otp');
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    error={resetErrors.otp}
                  />
                  <Button type="submit" disabled={resetLoading || otp.length !== 6}>
                    {resetLoading ? 'Verifying...' : 'Verify code'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive a code?{' '}
                    <button
                      type="button"
                      onClick={resendResetCode}
                      disabled={resetLoading || resendCooldown > 0}
                      className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </p>
                </form>
              )}

              {resetStep === 'new-password' && (
                <form onSubmit={submitResetPassword} className="space-y-4" noValidate>
                  <AuthFormField
                    id="resetNewPassword"
                    label="New password"
                    type="password"
                    value={newResetPassword}
                    onChange={(v) => { setNewResetPassword(v); clearResetError('newPassword'); }}
                    autoComplete="new-password"
                    maxLength={128}
                    error={resetErrors.newPassword}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? 'Resetting...' : 'Reset password'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closePanel} disabled={resetLoading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
