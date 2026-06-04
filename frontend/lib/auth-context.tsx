'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, api } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const res = await api<{ data: User }>('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshUser(); }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
