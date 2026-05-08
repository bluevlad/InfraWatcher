import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthUser } from './api';
import { fetchMe, logout as apiLogout, verifyGoogleCredential } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const me = await fetchMe();
    setUser(me);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const u = await verifyGoogleCredential(credential);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: !!user?.is_admin,
    loginWithGoogle,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
