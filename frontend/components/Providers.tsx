'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import AppLayout from '@/components/AppLayout';
import Toaster from '@/components/Toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </ToastProvider>
    </AuthProvider>
  );
}
